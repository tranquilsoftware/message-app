const mongoose = require('mongoose');  // For requesting information from MongoDB
const bodyParser = require('body-parser');
const cors = require('cors');  // for security during requests

const { PeerServer } = require('peer');

// for facetime/video call
const peerServer = PeerServer({port: 9000, path: '/peerjs'});

const express = require('express');  // Server
const http = require('http');
const app = express(); // Express app;
const server = http.createServer(app);

// easy to build safe accessible directory paths with this dependency
const path = require("path");  // For handling file uploads (profile pictures)





// models
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const User = require('./models/User');
const {decode} = require("jsonwebtoken");


// Require the .env environment file into our app
require('dotenv').config();
// attach body parser and cors to express app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));









// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200', // ONLY USE 4200
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  // allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  next();
})


app.options('*', cors()); // Allow all preflight requests



// Auth/ Tokens
const { authenticateToken } = require('../backend/middleware/Token');
// const { generateToken } = require('../src/app/services/authUtils'); // for mkaing JWT Tokens.

// Import the routes
const messagesRoutes = require('./routes/MessagesRoutes');
const registerRoutes = require('./routes/RegisterRoutes');
const loginRoutes = require('./routes/LoginRoutes');
const settingsRoutes = require('./routes/SettingsRoutes');
const groupRoutes = require('./routes/GroupRoutes');
const chatRoomRoutes = require('./routes/ChatRoomRoutes');
const usersRoutes = require('./routes/UsersRoutes');

// Use the routes we've defined:
app.use('/api/messages', messagesRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chatrooms', chatRoomRoutes);
app.use('/api/users', usersRoutes);



// Allow serving (GET requests) from users, to the following directories below.
app.use(express.static(path.join(__dirname, 'public')));



// Connect to mongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(r => console.log('MongoDB successfully connected!'))
.catch(error => console.error('MongoDB did NOT connect succesfully. Error: ', error));

























// ERROR HANDLING
// tell us if there was an unhandled request (u havent set up something right)
app.use((req, res, next) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  next();
});





// SOCKET.IO PART.

// WORKING SOCKET.IO SERVER SETUP
const io = require('socket.io')(server, {
  pingTimeout: 5000, // 5 sec
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }

});




// SETUP PORT AND START SERVER.

// Start server only after successful connection
const PORT = process.env.PORT || 5000; // DEFAULT PORT FOR EXPRESS SERVER . KEEP UNIQUE DIFFERENT FROM 4200
server.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});






// Socket.IO WebSocket connection handling
io.on('connection', (socket) => {
  console.log('(socket) New client connected');



  // new message socket operation
  socket.on('new-message', (message_data) => {

    console.log('(socket) Received new message:', message_data);

    // (mongoDB) declare the new Message schema ..
    const new_message = new Message({
      chatRoomId: message_data.chatRoomId,

      senderId: {
        username: message_data.senderId.username,
        profile_pic: message_data.senderId.profile_pic
      },

      msgContent: message_data.msgContent,
      timestamp:  new Date(message_data.timestamp),
      read:       message_data.read
    })

    new_message.save()
      .then((saved_message) => {

        // Broadcast the saved message to all clients in the room
        //   This operation, populates messages on screen, that were sent from other people.
        io.to(message_data.chatRoomId).emit('new-message', saved_message);
        // console.log('Message saved successfully:', saved_message);

    }).catch((err) => {
      console.error('Error happened whilst saving the new message received! :', err);
      socket.emit('message-error', { error: 'Failed to save message!'});
    });
  });






  // Handle request for initial messages
  socket.on('get-initial-messages', async (roomId) => {
    socket.emit('get-initial-messages', roomId);
  });









  // Handle request for room members
  socket.on('get-room-members', (roomId) => {
    // For now, we'll just send a placeholder response
    // TODO
    socket.emit('room-members', ['User1', 'User2', 'User3']);
  });





  // JOIN channelId/chatroomId
  socket.on('join', async (roomId) => {
    socket.join(roomId);
    console.log(`(socket) Client joined room ${roomId}`);

    try {

      // Fetch the last 10 messages for the room from MongoDB
      const messages = await Message.find({chatRoomId: roomId})
        .sort({timestamp: -1})
        .limit(10)
        .exec();

      // Send the messages to the client, messages need to be reversed to look correct
      socket.emit('initial-messages', messages.reverse());

    } catch (error) {
      console.error('Error fetching initial messages:', error);
    }
  });


    // Handle request for chat room name
    socket.on('get-chat-room-name', async (roomId) => {

      try {
        const chatRoom = await ChatRoom.findOne({ chatRoomId: roomId });
        if (chatRoom) {
          socket.emit('chat-room-name', chatRoom.chatRoomName);
          console.log('(socket) Chat room name:', chatRoom.chatRoomName);
        } else {
          socket.emit('chat-room-name', 'Unknown Room');
        }
      } catch (error) {
        console.error('Error fetching chat room name:', error);
        socket.emit('chat-room-name', 'Error');
      }
    });


    // Video chat -- need peer-id
    socket.on('peer-id', (peerId) => {
      // Associate the peerId with the user's socket
      socket.peerId = peerId;
      console.log(`User ${socket.id} associated with peer ID: ${peerId}`);
    });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log('(socket) Client disconnected');
  });


});







// After initiailizing everything, lets begin running the server
module.exports = { app, io };
