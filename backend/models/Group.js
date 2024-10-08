const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  groupId: { // ID of group
    type: String,
    required: true,
    unique: true,
    default: () => Math.random().toString(36).substr(2, 9)

  },
  
  admins: [{ // TODO it should be here on second thought. currently on users. there is array adminInGroupIds.
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  name: {
    type: String,
    required: true,
    unique: true
  },

  chatrooms: [{
    type: Schema.Types.ObjectId,
    // type: Number,
    required: false,
    ref: 'ChatRoom' // Reference to the ChatRoom model
  }],

  members: [{  // Add this field
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  pendingRequests: [{
    type: Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model
  }],


  createdAt: {
    type: Date,
    default: Date.now
  },

});

const Group = mongoose.model('Group', groupSchema, 'groups');
module.exports = Group;
