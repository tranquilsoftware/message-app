const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message schema
const messageSchema = new Schema({
  chatRoomId: {
    type: String,
    ref: 'ChatRoom', // Reference to the ChatRoom model
    required: true,
  },
  userId: { // Sent by user ID..
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: true,
  },
  msgContent: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false
  }
});

// create the Message model
const Message = mongoose.model('Message', messageSchema, 'messages');
module.exports = Message;
