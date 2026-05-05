require('dotenv').config();
const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/response');
const { User } = require('../models/index');

/**
 * Verify JWT token middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { id: decoded.id, active: 1, flag: 1 },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return unauthorized(res, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    return unauthorized(res, 'Invalid token');
  }
};

/**
 * Role-based access control middleware
 * @param {...string} roles - allowed role names
 */
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const { Role } = require('../models/index');
      const userWithRole = await User.findOne({
        where: { id: req.user.id },
        include: [{ model: Role, as: 'role' }],
      });

      if (!userWithRole || !userWithRole.role) {
        return forbidden(res, 'No role assigned');
      }

      if (!roles.includes(userWithRole.role.name)) {
        return forbidden(res, 'Insufficient permissions');
      }

      req.userRole = userWithRole.role;
      next();
    } catch (err) {
      return forbidden(res, 'Authorization failed');
    }
  };
};

module.exports = { authenticate, authorize };
