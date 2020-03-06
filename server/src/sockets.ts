import http from 'http';
import socketio from 'socket.io';

export default class Socket {
    constructor(server: http.Server) {
        let io = socketio(server);
        io.on('connection', (e) => console.log('conneciton'));
        io.on('connect', (e) => console.log('connect'));
    }
};