const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema for a chat room..
const chatRoomSchema = new Schema({

  groupId: [{ // belongs to GroupID..
    type: Schema.Types.ObjectId,
    ref: 'Group' // Reference to the User model
  }],

  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User' // Reference to the User model
  }],

  lastMessage: [{
    type: Schema.Types.ObjectId,
    ref: 'Message' // Reference to the Message model A
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// define the model for chat rooms..
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema, 'chatrooms');
module.exports = ChatRoom;
