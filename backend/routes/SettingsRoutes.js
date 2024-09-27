const express = require('express');
const router = express.Router();

// register API routing
const { authenticateToken } = require('../middleware/Token');
const User = require("../models/User");
const multer = require('multer');
const path = require("path");
const fs = require("fs");  // For handling file uploads (profile pictures)


// USER SETTINGS..

// GET  user settings..
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('req.userData:', req.userData);

    if (!req.userData/* || !req.userData.userId*/) {
      console.error('Username is missing from req.userData!!!');
      return res.status(400).json({ message: "Username is missing from request body." });
    }

    const user = await User.findById(req.userData.userId).select('-password').exec();

    if (!user) {
      console.log('The user could not be found!');
      return res.status(404).json({ message: "The user doesn't exist!" });
    }


    console.log('SUCCESS! Retrieving user settings! User: ', user);
    return res.json(user);
  } catch (error) {
    console.error('Error in GET /settings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});




// PUT/Update a user's setting..
router.put('/:setting', authenticateToken, async (req, res) => {
  const setting = req.params.setting;
  const value = req.body.value;

  console.log(`Attempting to update setting: ${setting} with value: ${value}`);
  console.log('Username from token:', req.userData.username);

  try {
    // const user_path = req.userData.username;
    const user = await User.findById(req.userData.userId).exec();

    if (!user) {
      console.log(`User with username: ${req.userData.username} and ID: ${req.userData.userId} not found.`);
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

      return res.status(400).json({ message: 'Invalid setting' });
    }
  } catch (error) {
    console.error('Error updating user setting:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// retuurn current user

router.get('/current', authenticateToken, async (req, res) => {
  try {
    // grab the user, without grabbing the password
    const user = await User.findById(req.userData.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });

    }

    return res.json(user);

  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});












// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination to the public/user_uploads directory
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'user_uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});


// Setup config for uploading
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit!

  // IDE says it is unused, however that is not true. It is reached.
  fileFilter: (req, file, cb) => {

    // (file valiation check)
    // Check if the file uploaded, is a valid image type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // The file is not an image, do not proceed to upload it.
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});


// Upload the user's profile picture..
router.post('/profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  console.log('Received request for profile picture upload');
  console.log('User ID from token:', req.userData.userId);

  try {
    if (!req.file) {
      return res.status(400)
        .json({message: 'Image could not be uploaded.'});
    }


    // grab the required user, without requesting the password.
    const user = await User.findById(req.userData.userId).select('-password').exec();
    console.log('Found user:', user);

    if (!user) {
      console.error('INVALID USER. DURING UPLOADING PP.');
      return res.status(404)
        .json({ message: 'User not found' });
    }


    // E.g. response:   profile_pic: '/public/user_uploads/profile_picture-215770044.png',
    const user_uploads_path = path.join('user_uploads', req.file.filename);
    user.profile_pic = `./${user_uploads_path.replace(/\\/g, '/')}`;
    console.log('user_uploads_path = ', user_uploads_path);

    // Save/Update User to mongoDB.
    await user.save();
    console.log('Profile picture successfully uploaded... Should return status 200!');



    const filePath = path.join(__dirname, '..', '..', 'public', user_uploads_path);
    console.log('server_url: ', filePath);

    // Check if the image that was tried to be uploaded, is on the server.
    if (fs.existsSync(filePath)) {
      // Send file
      res.sendFile(filePath);

      // Return 200 status and with users profile_pic
      return res.status(200).json({url: user.profile_pic});
    } else {
      console.error('File (assuming profile pic) does not exist! Or possible sync issue, maybe restart server!');
      return res.status(404).json({ message: 'File not found' });
    }



  } catch (error) {
    console.error('Error in profile picture upload:', error);
    return res.status(500)
      .json({ message: 'Server error' });
  }
});

module.exports = router;
