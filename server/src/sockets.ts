import http from 'http';
import socketio from 'socket.io';
import * as accounts from './accounts';
import { User, SendBatchEventData, RecieveBatchEventData } from '../../client/src/data/misc';
import { guestPfpUrl } from './users';

export interface JoinRoomData {
    users: User[];
    name: string;
}

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

        let packetRate = 0;
        let lastSendTime = 0;
        let maxPacketRate = 2000;

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
            let process = (): string | undefined => {
                if(data == null) return 'Data batch is null';
                if(data.data == null) return 'Data batch is null';
                if(data.recordStartTime == null) return '"recordStartTime" missing';
                if(data.data.length === 0) return 'Zero size data batch';
            
                packetRate -= (Date.now() - lastSendTime) / 1000 * maxPacketRate;
                lastSendTime = Date.now();
                if (packetRate < 0) packetRate = 0;
                if (packetRate > maxPacketRate) return 'Hitting event rate limit';
                packetRate += data.data.length;
    
                let time = data.recordStartTime;
                for(let i = 0; i < data.data.length; i++){
                    let p = data.data[0];
                    if(p.event == null) return 'Event type missing in event packet';
                    if(p.timestamp == null) return 'Timestamp missing on event packet';
                    if(time > p.timestamp) return 'Events must be in chronological time order';
                    time = p.timestamp;
                }

                if(time - data.recordStartTime > 10000) return 'Maximum event batch time range allowed is 1 second';
    
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
            if(error) emitToOthers('error', 'Event batch rejected: ' + error);
        })
    }
};