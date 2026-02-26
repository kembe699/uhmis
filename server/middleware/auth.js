const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and extract user info
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // If no token, set default user (for backward compatibility)
    req.user = { id: 1, role: 'admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // If token is invalid, set default user
      req.user = { id: 1, role: 'admin' };
      return next();
    }

    // Set user info from token
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      clinicId: decoded.clinicId
    };
    next();
  });
};

module.exports = { authenticateToken };
