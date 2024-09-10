const express = require('express');
const router = express.Router();
const User = require("../models/User");

const {generateToken} = require("../../src/app/services/authUtils");

// Login API routing
router.post('/api/login', async(req, res) => {
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

module.exports = router;
