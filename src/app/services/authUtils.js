const jwt = require('jsonwebtoken');

//TODO UPDATE , use environment variable for most secure in OS. (although it, WONT WORK ON LECTURER PC)
const SECRET_KEY = process.env.SECRET_KEY || 'secret'; // Use a default for local development


// This class is only used to get tokens (using jwt)
// (Not an angular service. not described in assignment)
const generateToken = (payload) => {
  // console.log('GENERATING TOKEN WITH KEY: [', SECRET_KEY, ']');

  if (!payload) {
    throw new Error('Payload is required for token generation');
  }

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1800s' });
};


module.exports = { generateToken };
