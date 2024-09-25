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



// ADMIN PANEL ROUTES
// GET all chatrooms


// POST a new chatroom
router.post('/', async (req, res) => {
  const chatroom = new ChatRoom({
    name: req.body.name,
    groupId: req.body.groupId
  });

  try {
    const newChatroom = await chatroom.save();
    res.status(201).json(newChatroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (Edit) a specific chatroom (parameterize the chatRoomId)
// ended up using /:groupId/chatrooms/:chatRoomId' in groups and that worked
router.put('/:chatRoomId', async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { chatRoomName } = req.body;
    { $set: { name: req.body.name } }

    const updatedChatroom = await ChatRoom.findOneAndUpdate(
      { chatRoomId: chatRoomId },
      { $set: { chatRoomName: chatRoomName } },
      { new: true }
    );

    if (!updatedChatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    res.json(updatedChatroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a specific chatroom
router.delete('/chatrooms/:id', async (req, res) => {
  try {
    const deletedChatroom = await ChatRoom.findByIdAndDelete(req.params.id);

    if (!deletedChatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }

    res.json({ message: 'Chatroom deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new chat room within a group
router.post('/groups/:groupId/chat-rooms', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const newChatRoom = new ChatRoom({
      chatRoomName: name,
      groupId: groupId,
      chatRoomId: Math.random().toString(36).substr(2, 9) // Generate a unique ID
    });

    const savedChatRoom = await newChatRoom.save();

    // Update the group to include the new chat room
    await Group.findByIdAndUpdate(groupId, { $push: { chatrooms: savedChatRoom._id } });

    res.status(201).json(savedChatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Error creating chat room' });
  }
});

module.exports = router;
