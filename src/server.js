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
const {decode} = require("jsonwebtoken");



// Require the .env environment file into our app
require('dotenv').config();
// attach body parser and cors to express app
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200', // ONLY USE 4200
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  // allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
}));

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
//   next();
// })


app.options('*', cors()); // Allow all preflight requests





// Connect to mongoDB
mongoose.connect(mongoDBPath).then(r => console.log('MongoDB successfully connected!'))
.catch(error => console.error('MongoDB did NOT connect succesfully. Error: ', error));



// define our api url
const apiUrl = '/api';




// Before anything! do the following important things...
// Middleware to authenticate JWT token
// const authenticateToken = (req, res, next) => {
//   // Log headers for debugging
// //   console.log('Authenticating token now..');
// //   console.log('Request Headers:', req.headers);
// //
// //   const authHeader = req.headers['authorization'];
// //   console.log('Auth header:', authHeader);
// //
// //   const token = authHeader && authHeader.split(' ')[1]; // extract token from header by splitting it
// //   if (!token) {
// //     console.error('Token missing in authorization header');
// //     return res.sendStatus(401).json({message: 'Missing token, it isnt in auth header'});
// //   }
// //
// //
// // //   jwt.verify(token, SECRET_KEY, (err, user) => {
// //   jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
// //     if (err) {
// //       console.error('>:(! Token verification failed:', err.message);
// //       return res.status(403).json({ message: 'Invalid token' });
// //     }
// //
// //     console.log(':D Token verified');
// //     req.user = user;
// //     next();
// //   });
//
//   try{
//     console.log('Authenticating token now..');
//     console.log('Request Headers:', req.headers);
//     const authHeader = req.headers['authorization'];
//     console.log('Auth header:', authHeader);
//     if (!authHeader) {
//       return console.error('Auth Header wasnt defined, returning!');
//     }
//
//     const token = req.headers.authorization.split(" ")[1];
//     const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
//     console.log('decoded token:')
//     req.userId = {userId: decodedToken.userId};
//   } catch (error) {
//     res.status(401).json({message: 'Most likely not authenticated'});
//   }
// }

// new auth
// module.exports = (req, res, next) => {
const authenticateToken = (req, res, next) => {
  try {

    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    console.error('(authenticateToken | decodedToken) :', decodedToken);
    req.userData = {
      email: decodedToken.email,
      userId: decodedToken.userId,
      username: decodedToken.username
    };

    // req.userId = {userId: decodedToken.userId};
    // next();
  } catch(error) {
    res.status(401).json({message: "You are not authenticated"});
  }
}


// Apply middleware to all routes that require authentication
app.use('/api/user/settings', authenticateToken);
app.use('/api/user/current', authenticateToken);

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


// GET the messages from a room
// app.post('/messages/:chatRoomId', async (req, res) => {









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
    // note: its parameterized as a raw password here. But, we use a pre-save hook to always hash it before we enter it.
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


    console.log('user._id: ', user._id);
    console.log('user.username', user.username);
    console.log('user.email', user.email);


    // Generate JWT token for valid user
    const token = generateToken({ userId: user._id, username: user.username, email: user.email });
    console.log('Generated token:', token);



    // try {
    //   const decoded = jwt.verify(token, process.env.SECRET_KEY);
    //   console.log('Token is valid:', decoded);
    //
    //
    //   const decodedToken = jwt.decode(token, { complete: true });
    //   console.log('\nDecoded token:', decodedToken);
    // } catch (err) {
    //   console.error('(server) Token verification failed:', err);
    // }





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
    console.log('\nUser _id:', req.userData.userId);
    const user = await User.findById(req.userData.userId).exec();


    if (!user) {
      console.log('The user u tried to find, we couldnt find anythign!');

      return res.status(404).json({ message: "The user doesn't exist!" });
    } else {
      console.log('SUCCESS! Retrieving user settings!');

    }

    return res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// PUT/Update a user's setting..
app.put('/api/user/settings/:setting', authenticateToken, async (req, res) => {
  const setting = req.params.setting;
  const value = req.body.value;

  console.log(`Attempting to update setting: ${setting} with value: ${value}`);
  console.log('User ID from token:', req.userData.userId);

  try {
    const user = await User.findById(req.userData.userId).exec();

    if (!user) {
      console.log(`User not found for ID: ${req.userData.userId}`);
      return res.status(404).json({ message: 'User not found!' });
    }


    // If the setting requested to change is one of the below, than its valid...
    if (['birthdate', 'dark_mode', 'notifications'].includes(setting)) {
      user[setting] = value;
      await user.save();
      console.log(`Setting ${setting} updated successfully for user ${req.userData.userId}`);
      return res.sendStatus(204);
    } else {
      // it looks like we requested something that doesn't exist yet..
      console.log(`We requested something that doesn't exist yet..
      \nInvalid setting: ${setting}`);
      res.status(400).json({ message: 'Invalid setting' });
    }
  } catch (error) {
    console.error('Error updating user setting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




app.get('/api/user/current', authenticateToken, async (req, res) => {
  try {
    // const user = await User.findById(req.user.userId).select('-password');
    const user = await User.findById(req.userData.userId).select('-password');

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    return res.json(user);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});







// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload the user's profile picture..
app.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  console.log('Received request for profile picture upload');
  console.log('User from token:', req.userData.userId);
  try {
    const user = await User.findById(req.userData.userId).exec();
    console.log('Found user:', user);

    if (!user) {
      console.error('INVALID USER. DURING UPLOADING PP.');
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming the file is stored in 'uploads' directory
    user.profile_pic = `/uploads/${req.file.filename}`; // Save file path in user profile
    await user.save();

    // res.json({ url: user.profile_pic });
    res.status(200).json({url: user.profile_pic}); //todo review
    console.log('Tried to save pp!');

  } catch (error) {
    console.error('Error in profile picture upload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});










// OTHERS..


// Protected route example
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the dashboard!', user: req.userData.username });
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



  // new message socket operation
  socket.on('new-message', (new_message) => {
    console.log('(socket) Received new message:', new_message);

    // (mongoDB) declare the new Message schema ..
    const message = new Message(new_message);

    message.save().then(savedMessage => {
        console.log('Message saved successfully:', savedMessage);
        // Broadcast the saved message to all clients in the room
        //   This operation, populates messages on screen, that were sent from other people.
        socket.broadcast.to(message.chatRoomId).emit('new-message', message);
        //io.to(message.chatRoomId).emit('new-message', message);

    }).catch((err) => {
      console.error('Error happened whilst saving the new message received! :', err);
    });
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
    // TODO
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
