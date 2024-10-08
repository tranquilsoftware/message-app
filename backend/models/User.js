const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

// define our user schema model
const userSchema = new Schema({
  username: {
    type:     String,
    required: true,
    unique:   true
  },

  password: {
    type:     String,  // passwords are hashed in production. encrypted using bcrypt library
    required: true,
  },

  birthdate: {
    type:     String,
    required: false, // not required by default
  },

  email: {
    type:     String,
    required: false,  // For testing purposes, we dont require a email for account setup
    unique:   true
  },

  profile_pic: {  // Path to profile picture on web server
    type:     String,
    required: false,
    default:  './img/default_user.png'
  },

  dark_mode: {
    type:     Boolean,
    required: false, // not required by default
    default:  false
  },

  notifications: {
    type:     Boolean,
    required: false, // not required by default
    default:  true
  }, // todo: this is a placeholder for notifications to  be sent the the user

  // Roles & Groups

  // user can be multiple authorities
  roles: [{
    type: String,
    enum: ['super', 'groupAdmin', 'user'],
  }],

  groups: [{
    type: String,
    required: true,
    default: 1 // Refering to Group ID 1.. (General Group)
  }],

  adminInGroups: [{ // the groupids of groups that the user, is group-admin in. the ID has to be popualted within the user for them to have access to the website
    type: String,
    required: false,
  }],

});

// Pre-save hook to hash password
// Resource used: https://www.mongodb.com/blog/post/password-authentication-with-mongoose-part-1
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords WITH BCRYPT
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};






// GETTERS FOR USER MODEL
userSchema.methods.getUsername = function() {
  return this.username;
}

userSchema.methods.getProfilePicUrl = function() {
  return this.profile_pic;
}

// define user model.
const User = mongoose.model('User', userSchema, 'users');
module.exports = User;
