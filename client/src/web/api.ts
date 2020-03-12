import axios from "axios";
import socketio from 'socket.io-client';
import { User, BatchEventData, EventData, RecieveBatchEventData } from "../data/misc";
import events from 'events';

let baseURL = 'http://localhost:8080';

type ClientData = {
    guest: boolean;
    token: string;
    id: string;
    pfp: string;
    name: string;
    socket: SocketIOClient.Socket;
}

export interface JoinRoomData {
    users: User[];
    name: string;
}

declare interface BPRApi { // Event declarations
    on(event: 'user join', listener: (user: User) => void): this;
    on(event: 'user leave', listener: (user: User) => void): this;
    on(event: 'note on', listener: (user: string, key: number, velocity: number) => void): this;
    on(event: 'note off', listener: (user: string, key: number) => void): this;
    //on(event: string, listener: Function): this;
}

class BPRApi extends events.EventEmitter {
    private constructor(data: ClientData) {
        super();
        this._data = data;

        this._initWebsocket();
    }

    private _data: ClientData;

    get guest() { return this._data.guest; }
    get token() { return this._data.token; }
    get id() { return this._data.id; }
    get pfp() { return this._data.pfp; }
    get name() { return this._data.name; }

    private get io() { return this._data.socket; }

    static async logInAsGuest(name: string) {
        let acc = (await axios.post(`${baseURL}/api/accounts/guest`, { name })).data as User & { token: string };
        let token = acc.token;

        let tempTokenPromise = axios.post(`${baseURL}/api/accounts/temporary`, { token });

        let socket = socketio('http://localhost:8080');
        await new Promise((res, rej) => {
            socket.on('login', async (callback: any) => {
                let token = (await tempTokenPromise).data.token;
                callback(token)
            });
            socket.on('ready', () => {
                res()
            });
            socket.on('login error', () => {
                socket.close();
                rej(new Error('Login Failed'));
            });
            socket.on('error', console.error.bind(console));
        });

        let api = new BPRApi({
            ...acc,
            socket,
            guest: true,
        })

        return api;
    }

    private async _initWebsocket() {
        this.io.on('user joined', (user: User) => {
            this.emit('user join', user);
        })

        this.io.on('user left', (user: User) => {
            this.emit('user leave', user);
        })


    }

    private processDataPacket(data: RecieveBatchEventData) {
        let delay = Date.now() - data.recordStartTime;
        data.data.forEach(event => {
            setTimeout(() => this.processEvent(event, data.user), event.timestamp + delay);
        });
    }

    private processEvent(event: EventData, user: string) {
        if (event.event == 'note-on') {
            let data = event.data;
            this.emit('note on', user, data.key, data.velocity);
        }
        else if (event.event == 'note-off') {
            let data = event.data;
            this.emit('note off', user, data.key);
        }
    }

    pressKey(key: number, velocity: number){
        
    }

    async joinRoom(name: string) {
        return new Promise<JoinRoomData>(res => this.io.emit('join room', name, res));
    }
}

export default BPRApi;