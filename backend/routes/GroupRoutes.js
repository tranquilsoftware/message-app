const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const ChatRoom = require("../models/ChatRoom");



// GET all groups
// path: localhost/api/groups
router.get('/', async (req, res) => {
  try {
    // Fetch all groups from the database
    const groups = await Group.find();  // Mongoose query to fetch all groups

    // Respond with the list of groups
    res.status(200).json(groups);
  } catch (err) {
    // Handle error and send a response if something goes wrong
    res.status(500).json({ error: 'Failed to retrieve groups' });
  }
});




// GET a specific group.
// path: localhost/api/groups/:groupId
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findOne({ groupId: req.params.groupId });

    // failed to find group (return 404)
    if (!group) return res.status(404).json({message:'Group could not be found.'});

    const _chatRooms = await ChatRoom.find({ groupId: group._id });

    const groupWithChatRooms = {
      ...group.toObject(),
      chatRooms: _chatRooms
    };

    res.json(groupWithChatRooms);
  } catch (err) {
    res.status(500).json({error: err.message });
  }
})









// POST (Create) a new group!
// localhost/api/groups
router.post('/', async (req, res) => {
  const group = new Group({
    groupId: req.body.groupId,
    name:    req.body.name
  });

  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});





// CHATROOMS

// IDK IF THIS WORKS
// GET all chatrooms for a specific Group!
// path: localhost/api/groups/:groupId/chatrooms
router.get('/:groupId/chatrooms', async (req, res) => {
  try {
    const group = await Group.findOne({ groupId: req.params.groupId });
    if (!group) return res.status(404).json({message:'Group could not be found.'});

    // // Find chatrooms with matching groupId.
    // const chatrooms = await ChatRoom.find({ groupId: group.groupId });
    // res.json(chatrooms);

    const groupId = Number(req.params.groupId);  // Convert to Number
    console.log('Fetching chatrooms for groupId:', groupId);
    
    const chatrooms = await ChatRoom.find({ groupId });
    console.log('Found chatrooms:', chatrooms);
    
    res.json(chatrooms);
  } catch (err) {
    res.status(500).json({error: err.message });
  }
})



// Create (POST) a new chatroom within a group
router.post('/groups/:groupId/chatrooms', async (req, res) => {
  try {
    const group = await Group.findOne({ groupId: req.params.groupId });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const chatroom = new ChatRoom({
      chatRoomId: req.body.chatRoomId,
      name: req.body.name,
      groupId: group._id
    });

    const newChatRoom = await chatroom.save();
    res.status(201).json(newChatRoom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});





module.exports = router;
