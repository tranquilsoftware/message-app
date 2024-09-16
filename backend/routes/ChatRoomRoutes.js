const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');

// GET all chat rooms
// path: /api/chatrooms
router.get('/', async (req, res) => {
  try {

    // Mongoose query to fetch all chat rooms and populate the groupId field
    const chatrooms = await ChatRoom.find()
      .populate('groupId');

    // Respond with the list of chat rooms
    res.status(200).json(chatrooms);
  } catch (err) {
    // Handle error and send a response if something goes wrong
    res.status(500).json({ error: 'Failed to retrieve chat rooms' });
  }
});



// path: /api/chatrooms/group/:groupId
// Get Chatrooms for a specific group
router.get('/group/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    console.log('Fetching chatrooms for groupId:', groupId);

    const chatrooms = await ChatRoom.find({ groupId: groupId });
    console.log('Found chatrooms:', JSON.stringify(chatrooms, null, 2));
    console.log('Chatroom count:', chatrooms.length);

    if (chatrooms.length === 0) {
      // If no chatrooms found, let's log all chatrooms in the database
      const allChatrooms = await ChatRoom.find({});
      console.log('All chatrooms in database:', JSON.stringify(allChatrooms, null, 2));
    }

    res.status(200).json(chatrooms);
  } catch (err) {
    console.error('Error fetching chatrooms:', err);
    res.status(500).json({ error: 'Failed to retrieve chat rooms' });
  }
});

module.exports = router;
