const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message schema
const messageSchema = new Schema({
  chatRoomId: {
    type: String,
    ref: 'ChatRoom', // Reference to the ChatRoom model
    required: true,
  },

  senderId: { // Sent by user ID..
    type: new Schema({
      username: { type: String, required: true },
      profile_pic: { type: String }
    }),
    required: true,
    ref: 'User',  // Reference to the User model

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
