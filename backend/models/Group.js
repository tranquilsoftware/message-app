const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  _id: { // ID of group
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true,
    unique: true
  },
  chatRooms: [{
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom' // Reference to the ChatRoom model
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Group = mongoose.model('Group', groupSchema, 'groups');
module.exports = Group;
