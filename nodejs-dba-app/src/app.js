require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./config/database');
const { redis } = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dokumentasiRoutes = require('./routes/dokumentasi');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.APP_PORT || 3000;

// ─── Security & Parsing Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (_) {}

  res.json({
    status: 'ok',
    app: process.env.APP_NAME,
    env: process.env.APP_ENV,
    timestamp: new Date().toISOString(),
    services: {
      mysql: 'connected',
      redis: redisStatus,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dokumentasi', dokumentasiRoutes);
app.use('/api/logs', logRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 ${process.env.APP_NAME} running on http://localhost:${PORT}`);
    logger.info(`📋 Environment: ${process.env.APP_ENV}`);
  });
};

start();

module.exports = app;
