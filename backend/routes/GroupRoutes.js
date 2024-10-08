const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const ChatRoom = require("../models/ChatRoom");
const { authenticateToken } = require('../middleware/Token');
const User = require('../models/User');

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


// GET all groups for a specific user
// path: localhost/api/groups/user-groups
router.get('/user-groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const groups = await Group.find({ members: userId });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ message: 'Error fetching user groups' });
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
// WORKS.
// localhost/api/groups/:groupId/chatrooms
router.post('/:groupId/chatrooms', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { chatRoomName } = req.body;

    console.log('groupId:', groupId, " then Name:", chatRoomName);

    if (!chatRoomName) {
      return res.status(400).json({ message: 'Chat room name is required' });
    }

    const group = await Group.findOne({ groupId: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newChatRoom = new ChatRoom({
      chatRoomName: chatRoomName,
      groupId: groupId,
      chatRoomId: Math.random().toString(36).substr(2, 9) // Generate a unique ID
    });

    const savedChatRoom = await newChatRoom.save();

    // Initialize chatrooms as an empty array if it's null
    if (!group.chatrooms) {
      group.chatrooms = [];
    }

    group.chatrooms.push(savedChatRoom._id);
    await group.save();

    res.status(201).json(savedChatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Error creating chat room', error: error.message });
  }
});











// // CHATROOMS

// // GET all chatrooms for a specific Group!
// // path: localhost/api/groups/:groupId/chatrooms
router.get('/:groupId/chatrooms', async (req, res) => {
  try {
    const group = await Group.findOne({ groupId: req.params.groupId });
    if (!group) return res.status(404).json({message:'Group could not be found.'});


    const groupId = Number(req.params.groupId);  // Convert to Number
    console.log('Fetching chatrooms for groupId:', groupId);

    const chatrooms = await ChatRoom.find({ groupId });
    console.log('Found chatrooms:', chatrooms);

    res.json(chatrooms);
  } catch (err) {
    res.status(500).json({error: err.message });
  }
})








// ADMIN PANEL ROUTES

// PUT (Edit) a specific group
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, chatrooms } = req.body;

    const group = await Group.findOne({ groupId: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (name) {
      group.name = name;
    }

    if (chatrooms && Array.isArray(chatrooms)) {
      group.chatrooms = chatrooms.map(chatroom => chatroom._id);
    }

    await group.save();

    const updatedGroup = await Group.findOne({ groupId: groupId })
      .populate('chatrooms');

    res.json(updatedGroup);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST (Create) a new group!
// localhost/api/groups
router.post('/', async (req, res) => {
  try {    
    const { name, admins, members, pendingRequests } = req.body;

    if (!name || !admins || admins.length === 0) {
      return res.status(400).json({ message: 'Group name and at least one admin are required' });
    }

    const group = new Group({
      name: name,
      groupId: Math.random().toString(36).substr(2, 9), // Generate a unique ID
      admins: admins,
      members: members || [],
      pendingRequests: pendingRequests || [],
      chatrooms: []
    });

    const newGroup = await group.save();

    console.log('group made: POST : ', newGroup);

    // Update the current user's adminInGroups
    const adminId = admins[0]; // Assuming the first admin is the creator
    await User.findByIdAndUpdate(adminId, {
      $push: { adminInGroups: newGroup.groupId },
      $addToSet: { roles: 'groupAdmin' }
    });

    res.status(201).json(newGroup);
  } catch (err) {
    console.error('Error creating group:', err);
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








// Group Admin Requests And Approval


// Request to join a group
router.post('/:groupIdOrName/join-request', authenticateToken, async (req, res) => {
  console.log('Join request route hit');  // Add this line

  const groupIdOrName = req.params.groupIdOrName;
  const userId = req.userData.userId;
  const username = req.userData.username;
  console.log(`Received join request for group ${groupIdOrName} from user ${username} with id:${userId}`);

  try {

    // Search for the group by either groupId or name
    const group = await Group.findOne({
      $or: [
        { groupId: groupIdOrName },
        { name: groupIdOrName }
      ]
    });
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log(`Group found: ${group.name}`);

    // (make sure the members & pendingRequests exist in the group object (probably doesnt need to be in productio code))
    // Check if the user is already a member of the group
    if (group.members && group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Check if there's already a pending request
    if (group.pendingRequests && group.pendingRequests.includes(userId)) {
      return res.status(400).json({ message: 'A join request for this group already exists' });
    }


    // Lastly, add the new user to pendingRequests
    await Group.findByIdAndUpdate(group._id, {
      $addToSet: { pendingRequests: userId }
    });


    res.status(200).json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error sending join request:', error);
    res.status(500).json({ message: 'Error sending join request', error: error.message });
  }
});

// Get pending join requests (for group admins)
router.get('/admin/pending-requests', authenticateToken, async (req, res) => {
  console.log('Pending requests route hit');
  console.log('req.userData:', req.userData);

  try {
    if (!req.userData || !req.userData.userId) {
      console.log('User data not found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.userData.userId; // Use userData set by authenticateToken middleware
    console.log('userId (pending-requests):', userId);

    // First, fetch the user to get their adminInGroups
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user);
    console.log('adminInGroups:', user.adminInGroups);

    // Find groups where the user is an admin and there are pending requests
    const adminGroups = await Group.find({
      groupId: { $in: user.adminInGroups },
      pendingRequests: { $exists: true, $ne: [] }
    }, { name: 1, groupId: 1, pendingRequests: 1 })
    .populate('pendingRequests', 'username email profile_pic');

    console.log('Populated admin groups:', JSON.stringify(adminGroups, null, 2));


    res.status(200).json(adminGroups);


  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending requests' });
  }
});

// Approve join request
router.post('/admin/approve-request/:groupId/:userId', authenticateToken, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findOne({ groupId: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from pendingRequests and add to members
    await Group.findByIdAndUpdate(group._id, {
      $pull: { pendingRequests: userId },
      $addToSet: { members: userId }
    });

    // Add group to user's groups
    await User.findByIdAndUpdate(userId, {
      $addToSet: { groups: group._id }
    });

    res.status(200).json({ message: 'Join request approved' });
  } catch (error) {
    console.error('Error approving join request:', error);
    res.status(500).json({ message: 'Error approving join request', error: error.message });
  }
});

// Reject join request
router.post('/admin/reject-request/:groupId/:userId', authenticateToken, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findOne({ groupId: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove user from pendingRequests
    await Group.findByIdAndUpdate(group._id, {
      $pull: { pendingRequests: userId }
    });

    res.status(200).json({ message: 'Join request rejected' });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    res.status(500).json({ message: 'Error rejecting join request', error: error.message });
  }
});


module.exports = router;
