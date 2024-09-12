const express = require('express');
const router = express.Router();

// register API routing
const {generateToken} = require("../middleware/Token");
const User = require("../models/User");
router.post('/', async(req, res) => {
  try {
    const { username, password, email } = req.body;

    // basic validation
    if (!username || !password || !email) {
      return res.status(400).send('All fields are required');
    }

    // const token = generateToken({ userId: username });


    // Create new user
    // note: its parameterized as a raw password here. But, we use a pre-save hook to always hash it before we enter it.
    const newUser = new User({ username, password, email });

    await newUser.save();

    if (!newUser._id) {
      throw new Error('User ID is undefined. ERROR WITH MAKING _id FROM MONGODB');
    }

    const token = generateToken({
      userId: newUser._id,
      email: email,
      username: username
    });

    console.log('newUser._id test: ', newUser._id)

    // Respond with the token, expiration, and userId (CORRECT)
    res.status(200).json({
      token: token,
      userId: newUser._id // Include the userId in the response
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
