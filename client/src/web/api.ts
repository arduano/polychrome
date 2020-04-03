import axios from "axios";
import socketio from 'socket.io-client';
import { User, BatchEventData, EventData, RecieveBatchEventData, SendBatchEventData, JoinedUser } from "../data/misc";
import events from 'events';

const baseURL = process.env.PUBLIC_URL || 'http://localhost:8080';

type Color = {
    r: number;
    g: number;
    b: number;
}

type ClientData = {
    guest: boolean;
    token: string;
    id: string;
    pfp: string;
    name: string;
    color: Color;
    socket: SocketIOClient.Socket;
}

export interface JoinRoomData {
    users: JoinedUser[];
    name: string;
}

interface ReadyData {
    color: Color;
}

type UserEventData = {
    user: string;
    data: EventData;
}

async function delay(time: number) {
    if (time <= 0) return;
    await new Promise(res => setTimeout(res, time));
}

declare interface BPRApi { // Event declarations
    on(event: 'user join', listener: (user: JoinedUser) => void): this;
    on(event: 'user leave', listener: (user: JoinedUser) => void): this;
    on(event: 'note on', listener: (user: JoinedUser, key: number, velocity: number) => void): this;
    on(event: 'note off', listener: (user: JoinedUser, key: number) => void): this;
    on(event: 'chat', listener: (text: string, user: JoinedUser) => void): this;
    on(event: 'error', listener: (error: string) => void): this;
}

class BPRApi extends events.EventEmitter {
    private constructor(data: ClientData) {
        super();
        this._data = data;

        this._initWebsocket();
    }

    private _data: ClientData;

    private roomUsers: JoinedUser[] = [];

    private noteDataBuffer: EventData[] = [];
    private noteDataRecordStart: number = Date.now();

    private processorIteration: number = 0;

    private packetQueue: UserEventData[] = [];

    get guest() { return this._data.guest; }
    get token() { return this._data.token; }
    get id() { return this._data.id; }
    get pfp() { return this._data.pfp; }
    get name() { return this._data.name; }
    get color() { return this._data.color; }
    get self(): JoinedUser { return { color: this.color, name: this.name, id: this.id, pfp: this.pfp }; }

    get defaultRoom() { return 'main'; }

    private get io() { return this._data.socket; }

    static async logInAsGuest(name: string) {
        let acc = (await axios.post(`${baseURL}/api/accounts/guest`, { name })).data as User & { token: string };
        let token = acc.token;
        let color: Color | undefined = undefined;

        let tempTokenPromise = axios.post(`${baseURL}/api/accounts/temporary`, { token });

        let socket = socketio(baseURL);
        await new Promise((res, rej) => {
            socket.on('login', async (callback: any) => {
                let token = (await tempTokenPromise).data.token;
                callback(token)
            });
            socket.on('ready', (data: ReadyData) => {
                color = data.color;
                res()
            });
            socket.on('login error', () => {
                socket.close();
                rej(new Error('Login Failed'));
            });
        });

        let api = new BPRApi({
            ...acc,
            socket,
            guest: true,
            color: color!
        })

        socket.on('_error', (error: string) => {
            api.emit('error', error);
            console.error(error);
        });

        return api;
    }

    private async _initWebsocket() {
        this.io.on('user joined', (user: JoinedUser) => {
            if (this.roomUsers.findIndex(u => u.id == user.id) != -1) return;
            this.roomUsers.push(user);
            this.emit('user join', user);
        })

        this.io.on('user left', (user: JoinedUser) => {
            let i = this.roomUsers.findIndex(u => u.id == user.id);
            if (i != -1) this.roomUsers.splice(i, 1);
            this.emit('user leave', user);
        })

        this.io.on('data', (data: RecieveBatchEventData) => {
            this.processDataPacket(data);
        })

        this.io.on('chat', (text: string, user: string) => {
            let joinedUser = this.roomUsers.find(u => u.id === user);
            this.emit('chat', text, joinedUser);
            console.log(user + ": " + text);
        })

        this.noteSendLoop();
    }

    private async noteSendLoop() {
        while (!this.io.disconnected) {
            if (this.noteDataBuffer.length != 0) {
                let data: SendBatchEventData = {
                    recordStartTime: this.noteDataRecordStart,
                    data: this.noteDataBuffer
                }
                this.io.emit('data', data);
            }

            this.noteDataBuffer = [];
            this.noteDataRecordStart = Date.now();
            await delay(100);
        }
    }

    public sendMessage(text: string) {
        this.io.emit('send msg', text);
    }

    private async eventProcessor() {
        this.processorIteration++;
        let iteration = this.processorIteration;
        while (this.packetQueue.length > 0) {
            let packet = this.packetQueue[0];
            await delay(packet.data.timestamp - Date.now());
            if (this.processorIteration !== iteration) return;
            this.packetQueue.splice(0, 1);
            this.processEvent(packet.data, packet.user);
        }
    }

    private async processDataPacket(data: RecieveBatchEventData) {
        let offset = Date.now() - data.recordStartTime;
        let packets = data.data;
        data.data.forEach(packet => {
            packet.timestamp += offset;
            let userPacket = {
                user: data.user,
                data: packet
            }
            if (this.packetQueue.length === 0 || this.packetQueue[this.packetQueue.length - 1].data.timestamp >= packet.timestamp) {
                this.packetQueue.push(userPacket);
            }
            else {
                this.packetQueue.push(userPacket);
            }
        });
        this.eventProcessor();
    }

    private processEvent(event: EventData, user: string) {
        let joinedUser = this.roomUsers.find(u => u.id === user);

        if (event.event == 'note-on') {
            let data = event.data;
            this.emit('note on', joinedUser, data.key, data.velocity);
        }
        else if (event.event == 'note-off') {
            let data = event.data;
            this.emit('note off', joinedUser, data.key);
        }
    }

    pressKey(key: number, velocity: number) {
        this.noteDataBuffer.push(
            {
                event: "note-on",
                timestamp: Date.now(),
                data: {
                    key: key,
                    velocity: velocity
                }
            }
        );
    }

    unpressKey(key: number) {
        this.noteDataBuffer.push(
            {
                event: "note-off",
                timestamp: Date.now(),
                data: {
                    key: key
                }
            }
        );
    }

    async joinRoom(name: string) {
        let data = await new Promise<JoinRoomData>(res => this.io.emit('join room', name, res));
        this.roomUsers = data.users;
        return data;
    }

    static getAudioUrl(key: number) {
        return `${baseURL}/api/audio/${key}`;
    }
}

export default BPRApi;