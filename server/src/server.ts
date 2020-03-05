import express from 'express';
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

app.listen(port, () => console.log(`App listening on port ${port}!`))