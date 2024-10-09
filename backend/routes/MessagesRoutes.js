const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require("../models/ChatRoom");

// image uploads in chat room
const multer = require('multer');
const path = require('path');

// Endpoint to GET (load) messages for a specific chat room
router.get('/:chatRoomId', async (req, res) => {
  try {

    const chatRoomId = req.params.chatRoomId;
    const messages = await Message.find({ roomId: chatRoomId });

    console.log('Loading chatroom ID:', chatRoomId, ' messages.');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Send a new message
router.post('/', async (req, res) => {
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


// Upload image to chatroom
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/user_uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.post('/upload-image', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/user_uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});


module.exports = router;
