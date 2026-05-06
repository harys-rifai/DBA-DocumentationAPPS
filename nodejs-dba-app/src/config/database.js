require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const dialect = process.env.DB_DIALECT || 'mysql';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || (dialect === 'postgres' ? 5432 : 3306),
    dialect: dialect,
    schema: process.env.DB_SCHEMA || 'ai',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`${dialect.toUpperCase()} connection established successfully.`);
  } catch (error) {
    logger.error(`Unable to connect to ${dialect.toUpperCase()}:`, error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

