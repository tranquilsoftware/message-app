const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || 'secret'; // Use a default for local development

const authenticateToken = (req, res, next) => {
  try {
    // Verify auth header before anythhing.
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
      console.error('No Authorization header present');
      return res.status(401).json({message: "No Authorization header present"});
    }

    // extract token
    const token = req.headers.authorization.split(" ")[1];

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    console.log('(authenticateToken) Decoded token :', decodedToken);

    req.userData = {
      userId: decodedToken.userId,
      email: decodedToken.email,
      username: decodedToken.username
    };

    // console.log('SET req.userData :', req.userData);

    next(); // Proceed to next middleware or route handling operation
  } catch(error) {
    console.error('Token authentication error:', error);
    console.error('Error stack:', error.stack);
    return res.status(401).json({
      message: "You are not authenticated",
      error: error.message,
      stack: error.stack
    });
  }
}

// Generate a token based on _id, username, email
const generateToken = (user) => {
  console.log('GENERATING TOKEN WITH KEY: [', SECRET_KEY, ']');

  if (!user) {
    throw new Error('Payload is required for token generation');
  }

  const payload = {
    userId: user.userId,
    username: user.username,
    email: user.email
  };
  console.log('Token payload:', payload); // Log the payload
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};


/** used for getting the user ID from the token, and setSession() in authentication.service.ts */
const jwtDecode = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

module.exports = { authenticateToken, generateToken, jwtDecode };
