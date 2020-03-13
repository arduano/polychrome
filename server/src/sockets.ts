import http from 'http';
import socketio from 'socket.io';
import * as accounts from './accounts';
import { User, SendBatchEventData, RecieveBatchEventData } from '../../client/src/data/misc';
import { JoinRoomData } from '../../client/src/web/api';
import { guestPfpUrl } from './users';

type RoomUser = {
    id: string;
    socket: socketio.Socket;
} & (accounts.GuestToken | accounts.UserToken)

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
                    socket.emit('ready');
                    this.processClient(socket, data);
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

    processClient(socket: socketio.Socket, data: accounts.GuestToken | accounts.UserToken) {
        let room: string | null = null;
        let roomUser = {
            ...data,
            socket,
            id: data.id
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
                let userData = await this.getDataByToken(data);
                emitToOthers('user left', userData);
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
            this.rooms[r].users.push({ ...data, id: data.id, socket });

            let userData = await this.getDataByToken(data);
            emitToOthers('user joined', userData);
        }

        socket.on('disconnect', async () => {
            if (room !== null) {
                await leaveRoom();
            }
        })

        socket.on('join room', async (room, callback) => {
            await joinRoom(room);
            let userData = await Promise.all(this.rooms[room].users.map(this.getDataByToken));
            let roomData: JoinRoomData = {
                name: room,
                users: userData
            }
            callback(roomData);
        })

        socket.on('data', async (data: SendBatchEventData) => {
            let data2: RecieveBatchEventData = {
                data: data.data,
                endTime: 0,
                startTime: 0,
                recordStartTime: data.recordStartTime,
                reduceLatency: data.reduceLatency,
                user: roomUser.id
            }
            emitToOthers('data', data2);
        })
    }
};