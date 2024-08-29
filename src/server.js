const mongoose = require('mongoose');  // For requesting information from MongoDB
const bodyParser = require('body-parser');
const cors = require('cors');  // for security during requests
const jwt = require('jsonwebtoken');  // For generating and verifying JWT tokens
const multer = require('multer');  // For handling file uploads (profile pictures)


const { generateToken } = require('../src/app/services/authUtils'); // for mkaing JWT Tokens.

const express = require('express');  // Server
const http = require('http');
const app = express(); // Express app;
const server = http.createServer(app);






// mongo db path
const mongoDBPath = 'mongodb://localhost:27017/mydb';

// models
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const User = require('./models/User');


//   MIDDLEWARE
require('dotenv').config();
// attach body parser and cors to express app
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200', // ONLY USE 4200
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
}));


app.options('*', cors()); // Allow all preflight requests





// Connect to mongoDB
mongoose.connect(mongoDBPath).then(r => console.log('MongoDB successfully connected!'))
.catch(error => console.error('MongoDB did NOT connect succesfully. Error: ', error));



// define our api url
const apiUrl = '/api';

// Before anything! do the following important things...
// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  // Log headers for debugging
  console.log('Request Headers:', req.headers);

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.error('Authorization header missing');
    return res.sendStatus(401);
  }



  const token = authHeader && authHeader.split(' ')[1]; // extract token from header


  if (!token) {
    console.error('Token missing in authorization header');
    return res.sendStatus(401);
  } else if (token == null) {
    console.error('Authentication Token problem ! was nulL!!!');
    return res.sendStatus(401);
  }

  // Log token for debugging
  console.log(':) Token ACTUALLY extracted:', token);

// TODO SECRET KEY CHANGEss
  // why the fuck does it not work when i use var 'SECRET_KEY', but when i hardcode 'secret' it actually fucking works. i dont know. ive never seen anything like this
//   jwt.verify(token, SECRET_KEY, (err, user) => {
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      console.error('>:(! Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    console.log(':D HOLY SHIT IT WORKS');
    req.user = user;
    next();
  });
};

// Apply middleware to all routes that require authentication
app.use('/api/user/settings', authenticateToken);

// Endpoint to GET (load) messages for a specific chat room
app.get('/messages/:chatRoomId', async (req, res) => {
  try {
    const messages = await Message.find(
      { chatRoomId: req.params.chatRoomId })
      .populate('senderId', 'username profile_pic')
      .sort('timestamp')
      .exec();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Send a new message
app.post('/messages', async (req, res) => {
  const { chatRoomId, userId, msgContent } = req.body;

  const newMessage = new Message({
    chatRoomId, userId, msgContent, timestamp: new Date(),
  });

  if (!chatRoomId || !userId || !msgContent) {
    return res.status(400).send('Missing required fields');
  }

// try to send it to server
  try {
    const savedMessage = await newMessage.save();

    // update the rooms sent last msg..
    await ChatRoom.findByIdAndUpdate(chatRoomId, { lastMessage: savedMessage._id });
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// register API routing
app.post('/api/register', async(req, res) => {
  try {
    const { username, password, email } = req.body;

    // basic validation
    if (!username || !password || !email) {
      return res.status(400).send('All fields are required');
    }

    const token = generateToken({ userId: username });



    // Create new user
    // note: yeah its raw password here, we use a pre-save hook to always hash it before we enter it as a raw string.
    const newUser = new User({ username, password, email });
    await newUser.save();

    // Respond with the token, expiration, and userId (CORRECT)
    res.status(200).json({
      token,
      expiresIn: 3600, // Example expiration time in seconds
      userId: user._id // Include the userId in the response
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Server error');
  }
});




// login API routing
app.post('/api/login', async(req, res) => {
  const { username, password } = req.body;
  console.log('Attempting login with username:', username);

  try {
    const user = await User.findOne({username}).exec();

    // validate user
    if (!user) {
      console.log('User not found (probably doesn\'t exist');
      return res.status(401).json({message: 'Invalid credentials'});
    } else {
      console.log('Valid user. (exists)'); // developers msg for debugging , not necessery in release
    }

    // PASSWORD VALIDATION -- Compare to bcrypt hash
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({message: 'Invalid credentials'});
    }


    // console.log('SECRET_KEY:', process.env.SECRET_KEY);
    console.log('user._id: ', user._id);

    // Generate JWT token for valid user
    const token = generateToken({ userId: user._id });
    console.log('Generated token:', token);



    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log('Token is valid:', decoded);


      const decodedToken = jwt.decode(token, { complete: true });
      console.log('\nDecoded token:', decodedToken);
    } catch (err) {
      console.error('(server) Token verification failed:', err);
    }



    // Respond with the token, expiration, and userId (CORRECT)
    res.status(200).json({
      token,
      expiresIn: 3600, // Example expiration time in seconds
      userId: user._id // Include the userId in the response
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }

});















// USER SETTINGS..

// GET  user settings..
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    console.log('\nUser _id:', req.user.userId);
    const user = await User.findById(req.user.userId).exec();


    if (!user) {
      console.log('The user u tried to find, we couldnt find anythign!');

      return res.status(404).json({ message: "The user doesn't exist!" });
    } else {
      console.log('SUCCESS! Retrieving user settings!');

    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// PUT/Update a user's setting..
app.put('/api/user/settings/:setting', authenticateToken, async (req, res) => {
  const setting = req.params.setting;
  const value = req.body.value;

  console.log(`Attempting to update setting: ${setting} with value: ${value}`);
  console.log('User ID from token:', req.user.userId);

  try {
    const user = await User.findById(req.user.userId).exec();

    if (!user) {
      console.log(`User not found for ID: ${req.user.userId}`);
      return res.status(404).json({ message: 'User not found!' });
    }

    console.log('User found:', user.username);

    if (['birthdate', 'dark_mode', 'notifications'].includes(setting)) {
      user[setting] = value;
      await user.save();
      console.log(`Setting ${setting} updated successfully for user ${user.username}`);
      res.sendStatus(204);
    } else {
      console.log(`Invalid setting: ${setting}`);
      res.status(400).json({ message: 'Invalid setting' });
    }
  } catch (error) {
    console.error('Error updating user setting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload the user's profile picture..
app.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  console.log('Received request for profile picture upload');
  console.log('User from token:', req.user);
  try {
    const user = await User.findById(req.user.userId).exec();
    console.log('Found user:', user);

    if (!user) {
      console.error('INVALID USER. DURING UPLOADING PP.');
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming the file is stored in 'uploads' directory
    user.profile_pic = `/uploads/${req.file.filename}`; // Save file path in user profile
    await user.save();
    res.json({ url: user.profile_pic });
    console.log('Tried to save pp!');

  } catch (error) {
    console.error('Error in profile picture upload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// app.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
//   try {
//     console.log('trying to upload pp...');
//     // const user = await User.findById(req.user.username);
//     const user = await User.findById(req.user.userId).exec();
//
//     if (!user) {
//       console.error('INVALID USER. DURING UPLOADING PP.');
//       return res.status(404).json({ message: 'User not found' });
//     }
//
//     // Assuming the file is stored in 'uploads' directory
//     user.profile_pic = `/uploads/${req.file.filename}`; // Save file path in user profile
//     await user.save();
//
//     res.json({ url: user.profile_pic });
//
//     console.log('Tried to save pp!');
//
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });










// OTHERS..


// Protected route example
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the dashboard!', user: req.user.username });
});


// tell us if there was an unhandled request (u havent set up something right)
app.use((req, res, next) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  next();
});





// LISTEN.JS PART.

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

// Start server only after successful connection
const PORT = process.env.PORT || 5000; // DEFAULT PORT FOR EXPRESS SERVER . KEEP UNIQUE DIFFERENT FROM 4200
server.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});





// Socket.IO WebSocket connection handling
io.on('connection', (socket) => {
  console.log('(socket) New client connected');

  socket.on('new-message', (data) => { // TODO THIS LOGIC SHOULD BE NAMED 'new-message' AS IT IS A HOOK WHEN A NEW MESSAGE IS SENT RIGHT.
    console.log('(socket) Message received:', data);

    // Create a new Message..
    const message = new Message({
      chatRoomId: data.chatRoomId,
      userId: data.userId,
      senderId: data.senderId,
      msgContent: data.msgContent,
      timestamp: new Date(),
    });

    // Save the message to the database
    // const savedMessage = message.save();

    // Broadcast the saved message to all clients in the room
    io.to(data.chatRoomId).emit('new-message', data);
    // io.to(room_id).emit('new-message', { room_id, message: savedMessage });

    // io.to(data.roomId).emit('message', data);
  });



  // Handle request for initial messages
  socket.on('get-initial-messages', async (roomId) => {
    try {
      // Fetch the last 50 messages for the room from MongoDB
      const messages = await Message.find({ chatRoomId: roomId })
        .sort({ timestamp: -1 })
        .limit(50)
        .exec();

      // Send the messages to the client
      socket.emit('initial-messages', messages.reverse());
    } catch (error) {
      console.error('Error fetching initial messages:', error);
    }
  });

  // Handle request for room members
  socket.on('get-room-members', (roomId) => {
    // For now, we'll just send a placeholder response
    socket.emit('room-members', ['User1', 'User2', 'User3']);
  });

  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log(`(socket) Client joined room ${roomId}`);
  });


  socket.on('disconnect', () => {
    console.log('(socket) Client disconnected');
  });
});







// After initiailizing everything, lets begin running the server
module.exports = { app, io }; // goto listenjs
