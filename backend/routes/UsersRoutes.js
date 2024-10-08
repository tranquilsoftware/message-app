const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as needed
const { authenticateToken } = require('../middleware/Token');
const Group = require("../models/Group");



// Add this near your other route handlers
// Path: /api/users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});


// ADMIN PANEL ROUTSE
// Promote user to Group Admin
// Will apply the groupId to the user and add the groupAdmin role to the user
router.post('/:userId/promote-group-admin/:groupId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $addToSet: {
          roles: 'groupAdmin',
          adminInGroups: req.params.groupId
        }
      },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error promoting user to Group Admin:', error);
    res.status(500).json({ message: 'Error promoting user to Group Admin' });
  }
});
// Promote user to Super Admin
router.post('/:userId/promote-super-admin', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId,
      { $addToSet: { roles: 'super' } },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error promoting user to Super Admin:', error);
    res.status(500).json({ message: 'Error promoting user to Super Admin' });
  }
});

// Delete user
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Add new user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const newUser = new User({ username, email, password, roles: [role] });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});


// GROUP ADMIN
// GET the adminInGroups Array for a group-admin user
router.get('/:userId/admin-groups', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const adminGroups = await Group.find({ groupId: { $in: user.adminInGroups } });
    res.json(adminGroups);
  } catch (error) {
    console.error('Error fetching admin groups:', error);
    res.status(500).json({ message: 'Error fetching admin groups' });
  }
});


module.exports = router;

