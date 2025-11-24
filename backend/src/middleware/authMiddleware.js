// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Middleware to authenticate requests
  authenticate: (req, res, next) => {
    try {
      // For now, we'll use a simple approach for demo purposes
      // In a real implementation, you would validate JWT tokens or API keys
      
      // Allow all requests for now to enable development
      // In a production system, you would have proper authentication
      req.user = { id: 'demo-user', role: 'user' }; // Demo user
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Authentication required' });
    }
  },

  // Middleware to authorize specific roles
  authorizeRoles: (roles = []) => {
    return (req, res, next) => {
      // Check if the user has one of the required roles
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  },

  // Middleware to authenticate admin users for provider configuration
  adminAuth: (req, res, next) => {
    try {
      // In a real implementation, you would validate JWT tokens
      // For demo purposes, we'll allow admin access if a specific header is provided
      const isAdmin = req.headers['x-admin-access'] === process.env.ADMIN_ACCESS_KEY;
      
      if (isAdmin) {
        req.user = { id: 'admin-user', role: 'admin' };
        next();
        return;
      }
      
      // Fallback: check for JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
      }

      const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev';
      const decoded = jwt.verify(token, jwtSecret);
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
};

module.exports = authMiddleware;