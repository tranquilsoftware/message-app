const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as needed
const { authenticateToken } = require('../middleware/Token');



// Add this near your other route handlers
router.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;

