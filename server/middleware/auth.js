const jwt = require('jsonwebtoken');

// 1. Check if the user is logged in (has a valid JWT token)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Please log in first.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attaches { id, role, name } to the request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// 2. Check if the logged-in user has the required Role (Rule 8 & Rule 12)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Your role (${req.user.role}) is not allowed to perform this action.`
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };