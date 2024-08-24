const express = require('express');  // Server
const mongoose = require('mongoose');  // For requesting information from MongoDB
const bodyParser = require('body-parser');
const cors = require('cors');  // for security during requests
const jwt = require('jsonwebtoken');  // For generating and verifying JWT tokens

const { generateToken, SECRET_KEY } = require('../src/app/services/authUtils'); // for mkaing JWT Tokens.

const User = require('./models/User');
const app = express(); // Define Express app

// attach body parser and cors to express app
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));


app.options('*', cors()); // Allow all preflight requests


// Before anything! do the following important things...
// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


// define login routing
app.post('/api/login', async(req, res) => {
  const { username, password } = req.body;
  console.log('Attempting login with username:', username);

  try {
    const user = await User.findOne({ username }).exec();

    // validate user
    if (!user) {
      console.log('User not found (probably doesn\'t exist');

      return res.status(401).json({ message: 'Invalid credentials' });
    } else {
      console.log('Valid user. (exists)');
    }

    //compare password before proceeding.....
    const isMatch = await user.comparePassword(password);
    const name = user.getUsername();

    if (isMatch) {
      console.log('Successfully logged in! User:', name);

      // Generate JWT token for valid user
      const token = generateToken({ username: name });
      return res.json({ token });
    } else {
      res.status(401).json({message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({message: 'Server error. Contact Admin, and remain concerned.'});
  }
});

// USER SETTINGS..

// get user settings..
app.get(`${this.apiUrl}/user/settings`, authenticateToken, async(req, res) => {
  try {
    const user = await User.findOne({ username }).exec();

    // EXIT ON INVALID USER
    if (!user) {
      return res.status(404).json({ message: "The user doesn't exist! Quit hacking around.." });
    }
    res.json({
      name:           user.username,
      email:          user.email,
      profile_pic:    user.profile_pic,
      dark_mode:      user.dark_mode,
      notifications:  user.notifications
    });

  } catch (error) {
    res.status(500).json({message: 'Server error. Contact Admin, and remain concerned.'});
  }
} );

// Update a user's setting..
app.put('api/user/settings/:setting', authenticateToken, async(req, res) => {
  // declare request
  const { setting } = req.params;
  const { value } = req.body;

  // try updating the users stting
  try {
    const user = await User.findOne({ username: req.user.username});

    // EXIT ON INVALID USER..
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }
    user[setting] = value;
    await user.save();
    res.json({ message: 'Setting was updated successfully! '});
  } catch (error) {
    res.status(500).json({ messagae: 'Server error, '})
  }
});

// Upload the user's profile picture..
app.post('/api/user/profile-picture', authenticateToken, async (req, res) => {
  // Implement file upload logic here
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // user.profilePicture = 'localhost:4200/img/default_user.png';
    await user.save();
    res.json({ url: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});







// OTHERS..


// Protected route example
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the dashboard!', user: req.user.username });
});

// Connect to mongoDB
// mongo db path
const mongoDBPath = 'mongodb://localhost:27017/mydb';

mongoose.connect(mongoDBPath,  {
  useNewUrlParser: true, useUnifiedTopology: true
})
  .then(async () => {
    console.log('MongoDB successfully connected!');

  })
  .catch(error => console.error('MongoDB did NOT connect succesfully. Error: ', error));


// After initiailizing everything, lets begin running the server
const PORT = process.env.PORT || 5000; // PORT FOR EXPRESS SERVER . UKEEP UNIQUE FROM 4200, etc
app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});


