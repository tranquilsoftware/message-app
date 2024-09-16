const express = require('express');
const router = express.Router();

const User = require("../models/User");
const {generateToken} = require("../middleware/Token");
const {generate} = require("rxjs");

// Login API routing
router.post('/', async(req, res) => {

  try {
    const { username, password } = req.body;
    // console.log('Attempting login with username:', username);

    const user = await User.findOne({username}).exec();

    // Find our
    // const user = await User.findOne({ username: req.body.username });


    // validate user
    if (!user) {
      console.log('User not found (probably doesn\'t exist');
      return res.status(401).json({message: 'Invalid credentials'});
    }
    // PASSWORD VALIDATION -- Compare to bcrypt hash
     else if (await user.comparePassword(password)) {
       const token = generateToken( {
         userId: user._id,
         email: user.email,
         username: user.username
       });

      console.log('Generated token:', token);


      // Respond with the token, expiration, and userId (CORRECT)
      return res.status(200).json({
        token,
        expiresIn: 3600, // Example expiration time in seconds
        userId: user._id // Include the userId in the response
      });

      }



    // .. VALID USER, CONTINUE




    console.log('user._id: ', user._id);
    console.log('user.username', user.username);
    console.log('user.email', user.email);



  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }

});

module.exports = router;
