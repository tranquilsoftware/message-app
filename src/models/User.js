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
    type:     String,  // For testing obviously, passwords should be hashed in production
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
    default:  './img/default_user.png' // todo check that this address is pathed correctly.
  },

  dark_mode: {
    type:     Boolean,
    required: false,
    default:  false
  },  // TODO: implement dark mode (changes to css styling)

  notifications: {
    type:     Boolean,
    required: false,
    default:  true
  }, // todo: this is a placeholder for notifications to  be sent the the user, in some form of wahy.;


  roles: [{
    type: String,
    enum: ['super', 'group-admin', 'user'],  // Group-Admin isnt initilized here, it is given group-admin from what the group channels backend ADMIN is.
  }],

  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],

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

// // for comparing WITHOUT bcrypt // for testing development (raw string passowrds) like super, 123
// userSchema.methods.comparePassword = async function(parameterizedPass) {
//   let m_result = parameterizedPass === this.password;
//   console.log('login result:', m_result);
//   return m_result;
// }

userSchema.methods.getUsername = function() {
  return this.username;
}

// define user model.
const User = mongoose.model('User', userSchema, 'users');
module.exports = User;
