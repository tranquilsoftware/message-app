const express = require('express');
const router = express.Router();

// register API routing
const {generateToken} = require("../../src/app/services/authUtils");
const {authenticateToken} = require("../server")
const User = require("../models/User");
const multer = require("multer");

// USER SETTINGS..

// GET  user settings..
router.get('/api/user/settings', authenticateToken, async (req, res) => {
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
router.put('/api/user/settings/:setting', authenticateToken, async (req, res) => {
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




router.get('/api/user/current', authenticateToken, async (req, res) => {
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
router.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
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

module.exports = router;
