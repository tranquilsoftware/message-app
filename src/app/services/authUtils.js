const jwt = require('jsonwebtoken');

// Secret key for JWT signing and verification
const SECRET_KEY = 'secret'; // TODO UPDATE , use environment variable for most secure in OS. (WONT WORK ON LECTURER PC)

/**
 * Generates a JWT token.
 * @param {Object} payload - The payload to encode in the token.
 * @param {string} [secret=SECRET_KEY] - The secret key for signing the token.
 * @param {string} [expiresIn='1h'] - The token expiration time.
 * @returns {string} The generated token.
 */
const generateToken = (payload, secret = SECRET_KEY, expiresIn = '1h') => {
  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = { generateToken };
