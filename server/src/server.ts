import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
const bodyparser = require('body-parser');
import http from 'http';
import socketio from 'socket.io';
import Socket from './sockets';
import * as accounts from './accounts';
import path from 'path';

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = express()

const server = require('http').createServer(app);
const socket = new Socket(server);

const port = process.env.PORT || 8080;

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

type AuthReq = express.Request & {
    user: {
        id: string;
        guest: boolean;
    }
}

let checkAuth = (req: AuthReq, res: express.Response, next) => {
    let token = req.headers.authorization;
    let data = accounts.verifyToken(token);
    if (!data) {
        res.status(401).send('Invalid auth');
        return;
    }
    req.user = {
        guest: data.t == 'g',
        id: data.id
    }
    next();
}

let baseUrl = '/api'

function getAudioPath(num: number) {
    let n = num.toFixed(0);
    while (n.length < 3) n = '0' + n;
    let path = './audio/KEPSREC' + n + '.ogg';
    if (!fs.existsSync(path)) path = './audio/hammer.ogg';
    return path;
}

app.get('/api/audio/:key', (req, res) => {
    let key = req.params.key;
    let buffer = fs.readFileSync(getAudioPath(parseInt(key)))
    res.writeHead(200, 'SUCCESS', { 'content-type': 'audio/ogg' })
    res.end(buffer);
})

app.get('/api/info', (req, res) => {
    res.status(200).send({
        defaultRoom: 'main',
    })
})

app.post('/api/accounts/guest', (req, res) => {
    if (req.body.name == null) res.status(400).send('Name required');
    if (req.body.name.length >= 25) res.status(400).send('Name too long');
    let name = req.body.name.toString();
    res.status(200).send(accounts.makeGuestAccount(name));
})

app.post('/api/accounts/temporary', (req, res) => {
    if (req.body.token == null) res.status(400).send('Token required');
    let token = req.body.token.toString();
    let temp = accounts.makeTemporaryToken(token, 30);
    if (!temp) res.status(400).send('Invalid token');
    else res.status(200).send({ token: temp });
})

app.get('**', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'web', req.url))) {
        res.sendFile(path.join(__dirname, 'web', req.url))
    }
    else {
        res.sendFile('web/index.html', { root: __dirname })
    }
})

server.listen(port, () => console.log(`App listening on port ${port}!`));
//app.listen(port, () => console.log(`App listening on port ${port}!`))