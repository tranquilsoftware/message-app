const express = require('express');  // Server
const mongoose = require('mongoose');  // For requesting information from MongoDB
const bodyParser = require('body-parser');
const cors = require('cors');  // for security during requests
const setAuthToken = require('../src/app/services/authentication.service');
const jwt = require('jsonwebtoken');  // For generating and verifying JWT tokens

const { generateToken } = require('../src/app/services/authUtils'); // for mkaing JWT Tokens.
const { SECRET_KEY } = require('../src/app/services/authUtils');

const User = require('./models/User');
// Define Express app
const app = express();

// attach body parser and cors to express app
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));


// Hardcoded user for testing (obviously remove when building production/deploying)
const HARDCODED_USER = {
  username: 'qwe',
  password: '123' // Note: Passwords should be hashed in production!
};

app.options('*', cors()); // Allow all preflight requests


// define login routing
app.post('/api/login', async(req, res) => {
  const { username, password } = req.body;
  console.log('Attempting login with username:', username);

  try {
    const user = await User.findOne({ username }).exec();

    // validate user
    if (!user) {
      console.log('User not found (probably doesn\'t exist');

      // Check against hardcoded user (for testing purposes only)
      if (username === HARDCODED_USER.username && password === HARDCODED_USER.password) {
        // Generate JWT token for hardcoded user
        const token = generateToken({ username: HARDCODED_USER.username });
        return res.json({ token });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } else {
      console.log('Valid user. (exists)');
    }

    //compare password before proceeding.....
    const isMatch = await user.comparePassword(password);
    const name = user.getUsername();

    if (isMatch) {
      // console.log('Successfully logged in! User:', user.username);

      // Generate JWT token for valid user
      const token = generateToken({ username: HARDCODED_USER.username });
      return res.json({ token });
    } else {
      res.status(401).json({message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({message: 'Server error. Contact Admin, and remain concerned.'});
  }
});

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

    //
    // // // TEST REMOVE ALL DB AND MANUALLY ADD!!!!! HARDCODE TODO WARNING
    // await User.deleteMany({}); //clear for test
    //
    // const users = [
    //   {
    //     username: 'super',
    //     password: '123',
    //     roles: ['super'],
    //     groups: []
    //   },
    // ];
    //
    // await User.insertMany(users);
    // console.log('Users added successfully');

  })
  .catch(error => console.error('MongoDB did NOT connect succesfully. Error: ', error));


// After initiailizing everything, lets begin running the server
const PORT = process.env.PORT || 5000; // PORT FOR EXPRESS SERVER . UKEEP UNIQUE FROM 4200, etc
app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});


