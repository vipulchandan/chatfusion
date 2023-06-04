const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');

const formatMessage = require('./utils/messages');
const { 
    userJoin, 
    getCurrentUser, 
    userLeave, 
    getRoomUsers 
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
dotenv.config();

// SET STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// RUN WHEN CLIENT CONNECTS
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

         // WELCOMES CURRENT USER
        socket.emit('message', formatMessage(botName, 'Welcome to the chat!'));

        // BROADCAST WHEN USER CONNECTS
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // SEND USER TO ROOM INFO
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // LISTENS FOR CHAT MESSAGES FROM CLIENT
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // RUNS WHEN CLIENT DISCONNECTS
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }

        // SEND USER TO ROOM INFO
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});