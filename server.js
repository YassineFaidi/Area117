const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0, peers = {}, sockets = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    count += 1;

    console.log('A user connected:', socket.id);
    console.log('Number of online peers :', count);

    socket.on('login_request', (data) => {
        const username = data.username;
        const userimage = data.userimage;
        const publicKey = data.publicKey;

        if (peers[username]) {
            socket.emit("change_username", username);
        } else {
            socket.name = username;
            socket.profile = userimage;
            socket.publicKey = publicKey;
            socket.status = 'online';
            socket.connectedWith = null;

            peers[username] = [userimage, socket.status, socket.publicKey];
            sockets[username] = socket;

            socket.emit("actual_user_info", { myname: username, myimg: userimage });

            for (var i in sockets) {
                sockets[i].emit("online_peers", peers);
            }
        }
    });

    socket.on('offer', (data) => {
        if (sockets[data.receiver]) {
            var receiverSocket = sockets[data.receiver];
            receiverSocket.emit("offer", data);
        }
    });

    socket.on('answer', (data) => {
        if (sockets[data.receiver]) {
            var receiverSocket = sockets[data.receiver];
            receiverSocket.emit("answer", data);
        }
    });

    socket.on('icecandidate', (data) => {
        if (sockets[data.receiver]) {
            var receiverSocket = sockets[data.receiver];
            receiverSocket.emit("icecandidate", data);
        }
    });

    socket.on('disconnect', () => {
        count -= 1;
        console.log('A user disconnected:', socket.id);
        console.log('Number of online peers :', count);

        delete peers[socket.name];
        delete sockets[socket.name];

        for (var i in sockets) {
            sockets[i].emit("online_peers", peers);
        }

    });

    socket.on('leave', (peername) => {
        if (sockets[peername]) {
            var receiverSocket = sockets[peername];
            receiverSocket.emit("leave", socket.name);
        }
    });

});

const PORT = process.env.PORT || 1234;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Go to : http://localhost:${PORT}/`);
});