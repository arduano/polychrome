import http from 'http';
import socketio from 'socket.io';
import * as accounts from './accounts';
import { User, SendBatchEventData, RecieveBatchEventData, Color, JoinedUser } from '../../client/src/data/misc';
import { guestPfpUrl } from './users';

export interface JoinRoomData {
    users: JoinedUser[];
    name: string;
}

type RoomUser = {
    id: string;
    color: Color;
    socket: socketio.Socket;
} & (accounts.GuestToken | accounts.UserToken)

interface TempData {
    color: Color;
}

interface Room {
    users: RoomUser[];
    name: string;
}

export default class SocketRooms {
    rooms: { [name: string]: Room } = {};

    constructor(server: http.Server) {
        let io = socketio(server);
        // Emit welcome message on connection
        io.on('connection', (socket) => {
            socket.emit('login', async (token) => {
                let data = accounts.verifyToken(token);
                if (!data) socket.emit('login error');
                else {
                    let temp: TempData = {
                        color: HSVtoRGB(Math.random(), 1, 1)
                    }
                    socket.emit('ready', temp);
                    this.processClient(socket, data, temp);
                }
            });
        });
    }

    async getDataByToken(data: accounts.GuestToken | accounts.UserToken) {
        if (data.t === 'g') {
            let userData: User = {
                id: data.id,
                name: data.name,
                pfp: guestPfpUrl
            }
            return userData;
        }
        else {
            throw new Error('Non guests not supported');
            // get user data by id
        }
    }

    async processClient(socket: socketio.Socket, data: accounts.GuestToken | accounts.UserToken, temp: TempData) {
        let room: string | null = null;
        let roomUser = {
            ...data,
            socket,
            id: data.id
        }

        let packetRate = 0;
        let lastSendTime = 0;
        let maxPacketRate = 2000;

        let userData = await this.getDataByToken(data);
        let joinData: JoinedUser = {
            ...userData,
            color: temp.color
        }

        const emitToOthers = (event: string | symbol, ...args: any[]) => {
            if (room === null) return;
            let users = this.rooms[room].users;
            //console.log('sending', event, ...args)
            //console.log('count', users.length)
            users.forEach(u => {
                if (u.id !== roomUser.id) {
                    //console.log('sent', u.id)
                    u.socket.emit(event, ...args);
                }
            })
        }

        const leaveRoom = async () => {
            if (room === null) return;
            let users = this.rooms[room].users;
            users.splice(users.findIndex(u => u.id == roomUser.id), 1);
            if (users.length == 0) {
                delete this.rooms[room];
            }
            else {
                emitToOthers('user left', joinData);
            }
            room = null;
        }

        const joinRoom = async (r: string) => {
            if (r !== null) leaveRoom();
            room = r;

            if (!this.rooms[r]) {
                this.rooms[r] = {
                    name: r,
                    users: []
                }
            }
            this.rooms[r].users.push({ ...data, id: data.id, socket, color: joinData.color });

            emitToOthers('user joined', joinData);
        }

        socket.on('disconnect', async () => {
            if (room !== null) {
                await leaveRoom();
            }
        })

        socket.on('join room', async (room, callback) => {
            await joinRoom(room);
            let userData: JoinedUser[] = await Promise.all(this.rooms[room].users.map(async u => {
                return {
                    ...await this.getDataByToken(u),
                    color: u.color
                }
            }));
            let roomData: JoinRoomData = {
                name: room,
                users: userData
            }
            callback(roomData);
        })

        socket.on('data', async (data: SendBatchEventData) => {
            let process = (): string | undefined => {
                if (data == null) return 'Data batch is null';
                if (data.data == null) return 'Data batch is null';
                if (data.recordStartTime == null) return '"recordStartTime" missing';
                if (data.data.length === 0) return 'Zero size data batch';

                packetRate -= (Date.now() - lastSendTime) / 1000 * maxPacketRate;
                lastSendTime = Date.now();
                if (packetRate < 0) packetRate = 0;
                if (packetRate > maxPacketRate) return 'Hitting event rate limit';
                packetRate += data.data.length;

                let time = data.recordStartTime;
                for (let i = 0; i < data.data.length; i++) {
                    let p = data.data[0];
                    if (p.event == null) return 'Event type missing in event packet';
                    if (p.timestamp == null) return 'Timestamp missing on event packet';
                    if (time > p.timestamp) return 'Events must be in chronological time order';
                    time = p.timestamp;
                }

                if (time - data.recordStartTime > 10000) return 'Maximum event batch time range allowed is 1 second';

                let data2: RecieveBatchEventData = {
                    data: data.data,
                    endTime: time,
                    startTime: data.data[0].timestamp,
                    recordStartTime: data.recordStartTime,
                    user: roomUser.id
                }
                emitToOthers('data', data2);
            }

            let error = process();
            if (error) socket.emit('_error', 'Event batch rejected: ' + error);
        })

        socket.on('send msg', (text: string) => {
            emitToOthers('chat', text, roomUser.id);
        })
    }
};

function HSVtoRGB(h, s, v): Color {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}