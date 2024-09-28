require("dotenv").config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');  // Add this line

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let waitingUsers = [];

// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the chat page
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Serve the chat page
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Handle user joining the chat
    socket.on('join', () => {
        waitingUsers.push(socket);
        console.log(`User ${socket.id} is waiting for a match`);

        // Match users if there are at least two in the queue
        if (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();
            const room = `room-${user1.id}-${user2.id}`;

            user1.join(room);
            user2.join(room);

            user1.room = room;
            user2.room = room;

            user1.partnerId = user2.id;
            user2.partnerId = user1.id;

            io.to(room).emit('matched', { room: room });
            console.log(`Matched users ${user1.id} and ${user2.id} in room ${room}`);
        }
    });

    // Handle user sending a message
    socket.on('message', (message) => {
        io.to(socket.room).emit('message', { id: socket.id, message: message });
    });

    // Handle user requesting to match with next partner
    socket.on('next', () => {
        console.log('User requested next:', socket.id);
        if (socket.room) {
            socket.leave(socket.room);
            const partner = io.sockets.sockets.get(socket.partnerId);
            if (partner) {
                partner.leave(socket.room);
                partner.emit('disconnected');
                waitingUsers.push(partner);
            }
        }
        socket.room = null;
        socket.partnerId = null;
        socket.emit('waiting');
        waitingUsers.push(socket);
        console.log(`User ${socket.id} is waiting for a match`);

        // Match users if there are at least two in the queue
        if (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();
            const room = `room-${user1.id}-${user2.id}`;

            user1.join(room);
            user2.join(room);

            user1.room = room;
            user2.room = room;

            user1.partnerId = user2.id;
            user2.partnerId = user1.id;

            io.to(room).emit('matched', { room: room });
            console.log(`Matched users ${user1.id} and ${user2.id} in room ${room}`);
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        waitingUsers = waitingUsers.filter(user => user.id !== socket.id);

        if (socket.room) {
            socket.to(socket.room).emit('disconnected');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
