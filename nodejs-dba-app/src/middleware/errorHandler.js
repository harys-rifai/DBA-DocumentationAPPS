const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.APP_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
