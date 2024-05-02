// auth.js

const jwt = require('jsonwebtoken');

// Secret key for signing JWT tokens
const secretKey = '123'; // Change this to a secure key in production

// Function to generate JWT token
function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        // Add any other user data you want to include
    };
    const options = {
        expiresIn: '10h', // Token expiration time
    };
    return jwt.sign(payload, secretKey, options);
}

// Middleware function to verify JWT token
function verifyToken(req, res, next) {
    // Get token from request header
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token not provided.' });
    }

    // Verify token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        // Store decoded token data in request object
        req.user = decoded;
        next();
    });
}

module.exports = { generateToken, verifyToken };
