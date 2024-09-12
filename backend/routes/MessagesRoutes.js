const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require("../models/ChatRoom");

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

module.exports = router;
