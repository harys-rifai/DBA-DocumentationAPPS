require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/index');
const { success, badRequest, unauthorized } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return badRequest(res, 'Username and password are required');
    }

    const user = await User.findOne({
      where: { username, active: 1, flag: 1 },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      await logActivity(req, 'LOGIN', 'auth', `Failed login attempt for: ${username}`, 'failed');
      return unauthorized(res, 'Invalid credentials');
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      await logActivity(req, 'LOGIN', 'auth', `Wrong password for: ${username}`, 'failed');
      return unauthorized(res, 'Invalid credentials');
    }

    // Update last login & IP
    await user.update({
      last_login: new Date(),
      ip_comp: req.ip || req.connection.remoteAddress,
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logActivity(req, 'LOGIN', 'auth', `User ${username} logged in`, 'success');

    return success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role ? user.role.name : null,
      },
    }, 'Login successful');
  } catch (err) {
    logger.error('Login error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    await logActivity(req, 'LOGOUT', 'auth', `User ${req.user.username} logged out`);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    logger.error('Logout error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'role' }],
    });
    return success(res, user);
  } catch (err) {
    logger.error('Me error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to get user info' });
  }
};

module.exports = { login, logout, me };
