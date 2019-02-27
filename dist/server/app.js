"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const path = require("path");
const sio = require("socket.io");
const ball = require("./ball");
const app = express();
app.use(express.json());
app.use(express.static(path.join(path.dirname(__dirname), 'client')));
const server = http.createServer(app);
let players = [];
let gameRounds;
const port = process.env.PORT || 8090;
server.listen(port, () => console.log(`Server is listening on port ${port}...`));
let socket = sio(server);
function sendLeftPoints(num) {
    players[0].score = num;
    if (num >= gameRounds) {
        socket.emit('gameover', players);
        socket.emit('leftPoint', 0);
        return false;
    }
    socket.emit('leftPoint', num);
    return true;
}
exports.sendLeftPoints = sendLeftPoints;
function sendRightPoints(num) {
    players[1].score = num;
    if (num >= gameRounds) {
        socket.emit('gameover', players);
        socket.emit('rightPoint', 0);
        socket.emit('leftPoint', 0);
        return false;
    }
    socket.emit('rightPoint', num);
    return true;
}
exports.sendRightPoints = sendRightPoints;
function sendBallPosition(x, y) {
    socket.emit('ball', x, y);
}
exports.sendBallPosition = sendBallPosition;
// Handle the connection of new websocket clients
socket.on('connection', (socket) => {
    socket.on('login', function (newUserName) {
        let player = newUserName;
        if (players.length < 2) {
            players.push(player);
            socket.emit('login success', players.length);
        }
        socket.on('disconnect', function () {
            console.log('Got disconnect!');
            players.pop();
        });
    });
    socket.on('start game', function (clientHeight, clientWidth, ballHeight, ballWidth, paddleWidth, paddleHeight, paddleLeft, rounds) {
        if (players.length === 2) {
            gameRounds = rounds;
            socket.emit('game started');
            socket.broadcast.emit('game started');
            ball.ballFunction(clientHeight, clientWidth, ballHeight, ballWidth, paddleWidth, paddleHeight, paddleLeft);
        }
    });
    // Handle an ArrowKey event
    socket.on('ArrowKey', function (code, name) {
        if (players[0].name == name) {
            ball.setLeftPaddle(code);
        }
        else {
            ball.setRightPaddle(code);
        }
        ;
        // Broadcast the event to all connected clients except the sender
        socket.broadcast.emit('ArrowKey', code);
    });
});

//# sourceMappingURL=app.js.map
