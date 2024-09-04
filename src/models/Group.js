const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
