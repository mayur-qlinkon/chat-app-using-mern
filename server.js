const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // 1. Import Mongoose

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // Set to "*" for now so we don't get blocked during live deployment
        methods: ['GET', 'POST'],
    },
});

// 2. Paste your MongoDB Atlas Connection String here!
// Make sure to replace <password> with your actual database user password
const MONGO_URI = 'mongodb+srv://mayurpatadiya:Patadiya%40Mayur07@arthur.inmsjgl.mongodb.net/?appName=Arthur';

mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas cloud!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// 3. Define the blueprint (Schema) for our messages
const messageSchema = new mongoose.Schema({
    senderId: String,
    username: String,
    avatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
});

// Create the MongoDB Model
const Message = mongoose.model('Message', messageSchema);

// 4. API route to fetch message history
app.get('/messages', async (req, res) => {
    try {
        // Fetch all messages and sort them by the time they were created
        const messages = await Message.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🟢 A user connected: ${socket.id}`);

    socket.on('send_message', async (data) => {
        console.log('📥 Message received:', data);

        try {
            // Create a new message using our Mongoose Model and save it to the cloud
            const newMessage = new Message({
                senderId: data.senderId,
                username: data.username,
                avatar: data.avatar,
                text: data.text,
            });

            await newMessage.save(); // This saves it to MongoDB Atlas!

            // Once saved, broadcast it to all connected users
            io.emit('receive_message', data);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔴 A user disconnected: ${socket.id}`);
    });
});

// We use process.env.PORT so the live hosting service can assign its own port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Backend server is running on port ${PORT}`);
});
