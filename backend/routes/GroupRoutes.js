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



// Create a new chat room within a group
// localhost/api/groups/:groupId/chat-rooms
router.post('/:groupId/chatrooms', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    
    // SEEMS TO CAUSE IT TO NOT WORK!?!??!
    // const group = await Group.findOne({ groupId: groupId });
    // if (!group) {
    //   return res.status(404).json({ message: 'Group not found' });
    // }

    const newChatRoom = new ChatRoom({
      chatRoomName: name,
      groupId: groupId,
      chatRoomId: Math.random().toString(36).substr(2, 9) // Generate a unique ID
    });

    const savedChatRoom = await newChatRoom.save();

    // Update the group to include the new chat room
    await Group.findOneAndUpdate(
      { groupId: groupId },
      { $push: { chatrooms: savedChatRoom._id } }
    );

    res.status(201).json(savedChatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Error creating chat room' });
  }
});











// CHATROOMS

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
      groupId: group.groupId
    });

    const newChatRoom = await chatroom.save();
    res.status(201).json(newChatRoom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});





// ADMIN PANEL ROUTES

// PUT (Edit) a specific group
router.put('/:groupId', async (req, res) => {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { groupId: req.params.groupId },
      { $set: { name: req.body.name } },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST (Create) a new group!
// localhost/api/groups
router.post('/', async (req, res) => {
  const group = new Group({
    // groupId: req.body.groupId,
    name:    req.body.name
  });

  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// DELETE a specific group
router.delete('/:groupId', async (req, res) => {
  try {
    const deletedGroup = await Group.findOneAndDelete({ groupId: req.params.groupId });

    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Edit a chatroom within a group
router.post('/:groupId/chatrooms/:chatRoomId', async (req, res) => {
  try {
    const { groupId, chatRoomId } = req.params;
    const { name } = req.body;

    const updatedChatRoom = await ChatRoom.findOneAndUpdate(
      { groupId: groupId, chatRoomId: chatRoomId },
      { $set: { chatRoomName: name } },
      { new: true }
    );

    if (!updatedChatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    res.status(200).json(updatedChatRoom);
  } catch (error) {
    console.error('Error updating chat room:', error);
    res.status(500).json({ message: 'Error updating chat room' });
  }
});


// Delete a chatroom within a group
router.delete('/:groupId/chatrooms/:chatRoomId', async (req, res) => {
  try {
    const { groupId, chatRoomId } = req.params;

    const deletedChatRoom = await ChatRoom.findOneAndDelete({
      groupId: groupId,
      chatRoomId: chatRoomId
    });

    if (!deletedChatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Remove the chatroom reference from the group
    await Group.findOneAndUpdate(
      { groupId: groupId },
      { $pull: { chatrooms: deletedChatRoom._id } }
    );

    res.status(200).json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: 'Error deleting chat room' });
  }
});



module.exports = router;
