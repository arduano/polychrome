import express from 'express';
import fs from 'fs';
const bodyparser = require('body-parser');

const app = express()
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const port = 8080

let baseUrl = '/api'

function getAudioPath(num: number) {
    let n = num.toFixed(0);
    while (n.length < 3) n = '0' + n;
    let path = './src/audio/KEPSREC' + n + '.ogg';
    if (!fs.existsSync(path)) path = './src/audio/hammer.ogg';
        return path;
}

app.get('/api/audio/:key', (req, res) => {
    let key = req.params.key;
    let buffer = fs.readFileSync(getAudioPath(parseInt(key)))
    res.writeHead(200, 'SUCCESS', { 'content-type': 'audio/ogg' }).end(buffer)
})

app.listen(port, () => console.log(`App listening on port ${port}!`))