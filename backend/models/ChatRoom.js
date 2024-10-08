const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema for a chat room..
const chatRoomSchema = new Schema({

// belongs to GroupID..
  groupId: {
    type: String,
    // ref: 'Group', // Reference to the Group model
    required: true
  },

  chatRoomName: {
    type: String,
    required: true
  },

  chatRoomId: { // LETS NOT USE _id for Identifying the chatroom, instead we use chatRoomId
    type: String,
    required: true,
    unique: true
  },

  // members is in group model.. not here..

  // lastMessage: [{
  //   type: Schema.Types.ObjectId,
  //   // ref: 'Message' // Reference to the Message model A
  // }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// define the model for chat rooms..
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema, 'chatrooms');
module.exports = ChatRoom;
