const express = require('express');
const router = express.Router();

// register API routing
const {generateToken} = require("../../src/app/services/authUtils");
const User = require("../models/User");
router.post('/api/register', async(req, res) => {
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

module.exports = router;
