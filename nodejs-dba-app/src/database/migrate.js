require('dotenv').config();
const { sequelize, connectDB } = require('../config/database');
require('../models/index'); // load all models & associations
const logger = require('../utils/logger');

const migrate = async () => {
  try {
    await connectDB();
    // sync({ force: false }) = create table if not exists, don't drop existing
    await sequelize.sync({ alter: true });
    logger.info('All tables migrated successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
