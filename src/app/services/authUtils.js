const jwt = require('jsonwebtoken');

//TODO UPDATE , use environment variable for most secure in OS. (although it, WONT WORK ON LECTURER PC)
const SECRET_KEY = process.env.SECRET_KEY || 'secret'; // Use a default for local development


// This class is only used to get tokens (using jwt)
// (Not an angular service. not described in assignment)
// payload is currently user._id
const generateToken = (user) => {
  // console.log('GENERATING TOKEN WITH KEY: [', SECRET_KEY, ']');

  if (!user) {
    throw new Error('Payload is required for token generation');
  }

  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '3600s' });
};


module.exports = { generateToken };
