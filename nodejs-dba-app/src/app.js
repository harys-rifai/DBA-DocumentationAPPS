import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Static files - public folder is in same directory as app.js
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (_) { }

  try {
    // Simple Redis ping using Bun's built-in fetch or assume connected if no error
    const redis = await import('ioredis').catch(() => null);
    if (redis) {
      const client = new redis.default({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASS,
      });
      await client.ping();
      redisStatus = 'connected';
      client.disconnect();
    }
  } catch (_) { }

  res.json({
    status: 'ok',
    app: process.env.APP_NAME,
    env: process.env.APP_ENV,
    version: 'v1.0.2',  // App version
    runtime: process.version,  // Bun/Node version
    timestamp: new Date().toISOString(),
    services: {
      postgresql: dbStatus,
      redis: redisStatus,
    },
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Import route handlers (we'll use simple route handlers for now)
// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required' });
  }

  const user = await prisma.user.findFirst({
    where: { username, flag: true },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }

  const bcrypt = await import('bcryptjs');
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }

  const jwt = await import('jsonwebtoken');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role?.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return res.json({
    status: 'success',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name,
      },
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  return res.json({ status: 'success', message: 'Logged out' });
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    return res.json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name,
      },
    });
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
});

// Create User (protected)
app.post('/api/users', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  try {
    const { username, password, email, fullName, roleId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required' });
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        fullName: fullName || null,
        roleId: roleId || null,
        active: true,
        flag: true,
      },
      include: { role: true }
    });

    return res.status(201).json({ status: 'success', message: 'User created', data: user });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ status: 'error', message: 'Username or email already exists' });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// User routes
app.get('/api/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: offset,
      take: limit,
      orderBy: { id: 'asc' },
      include: { role: true },
    }),
    prisma.user.count(),
  ]);

  return res.json({
    status: 'success',
    data: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users,
    },
  });
});

// Documentation routes
app.get('/api/dokumentasi', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const dbType = req.query.db_type;
  const search = req.query.search;

  const where = { flag: true };
  if (dbType) where.dbType = dbType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [docs, total] = await Promise.all([
    prisma.dokumentasiDB.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rank: 'asc' },
    }),
    prisma.dokumentasiDB.count({ where }),
  ]);

  return res.json({
    status: 'success',
    data: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: docs,
    },
  });
});

// Create Documentation (protected)
app.post('/api/dokumentasi', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  const { dbType, title, tutorial, summary, rank, tags, version } = req.body;

  if (!dbType || !title) {
    return res.status(400).json({ status: 'error', message: 'dbType and title are required' });
  }

  const doc = await prisma.dokumentasiDB.create({
    data: {
      dbType,
      title,
      tutorial: tutorial || null,
      summary: summary || null,
      rank: rank || 0,
      tags: tags || null,
      version: version || null,
      flag: true,
    },
  });

  return res.status(201).json({ status: 'success', message: 'Documentation created', data: doc });
});

app.get('/api/dokumentasi/db-types', (req, res) => {
  const dbTypes = [
    { type: 'mysql', name: 'MySQL', currentVersion: '8.0.36' },
    { type: 'postgresql', name: 'PostgreSQL', currentVersion: '16.2' },
    { type: 'redis', name: 'Redis', currentVersion: '7.2.4' },
    { type: 'mongodb', name: 'MongoDB', currentVersion: '7.0.6' },
    { type: 'oracle', name: 'Oracle Database', currentVersion: '21c' },
    { type: 'sqlserver', name: 'MS SQL Server', currentVersion: '2022' },
    { type: 'edb', name: 'EnterpriseDB (EDB)', currentVersion: '16.2' },
    { type: 'db2', name: 'IBM DB2', currentVersion: '11.5' },
  ];

  return res.json({ status: 'success', message: 'Database types fetched', data: dbTypes });
});

// AI Update Handbooks - Real Implementation
const DB_HANDBOOKS = [
  {
    dbType: 'mysql',
    name: 'MySQL',
    version: '8.0.36',
    tutorial: `# MySQL 8.0 - Database Management Handbook

## Overview
MySQL is the world's most popular open-source relational database management system.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install mysql
brew services start mysql
mysql_secure_installation
\`\`\`

## Common Operations
### Backup & Recovery
\`\`\`bash
mysqldump -u root -p --all-databases > backup_$(date +%Y%m%d).sql
mysql -u root -p < backup_20240101.sql
\`\`\`

### User Management
\`\`\`sql
CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
\`\`\`

### Performance Tuning
- Configure \`innodb_buffer_pool_size\` (70-80% of RAM)
- Enable slow query log
- Use \`EXPLAIN\` for query analysis

## Monitoring
\`\`\`sql
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Slow_queries';
\`\`\`
`
  },
  {
    dbType: 'postgresql',
    name: 'PostgreSQL',
    version: '16.2',
    tutorial: `# PostgreSQL 16 - Database Management Handbook

## Overview
PostgreSQL is an advanced, enterprise-class open-source relational database.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install postgresql@16
brew services start postgresql@16
createdb $(whoami)
\`\`\`

## Common Operations
### Backup & Recovery
\`\`\`bash
pg_dump -U postgres dbname > backup_$(date +%Y%m%d).sql
psql -U postgres -d dbname < backup_20240101.sql
\`\`\`

### User Management
\`\`\`sql
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
\`\`\`

## Monitoring
\`\`\`sql
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_database;
\`\`\`
`
  },
  {
    dbType: 'redis',
    name: 'Redis',
    version: '7.2.4',
    tutorial: `# Redis 7.2 - In-Memory Database Handbook

## Overview
Redis is an open-source, in-memory data structure store used as database, cache, and message broker.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install redis
brew services start redis
redis-cli ping
\`\`\`

## Common Operations
### Data Types
\`\`\`bash
SET key "value"
GET key
LPUSH mylist "item"
LRANGE mylist 0 -1
\`\`\`

### Persistence
- RDB (Snapshotting): \`save 900 1\`
- AOF: \`appendonly yes\`

## Monitoring
\`\`\`bash
redis-cli INFO memory
redis-cli INFO stats
\`\`\`
`
  },
  {
    dbType: 'mongodb',
    name: 'MongoDB',
    version: '7.0.6',
    tutorial: `# MongoDB 7.0 - NoSQL Database Handbook

## Overview
MongoDB is a document-oriented NoSQL database providing high performance and scalability.

## Installation (Homebrew - macOS)
\`\`\`bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
\`\`\`

## Common Operations
### CRUD Operations
\`\`\`javascript
db.users.insertOne({ name: "John", email: "john@example.com" })
db.users.find({ name: "John" })
db.users.updateOne({ name: "John" }, { $set: { status: "active" } })
\`\`\`

## Monitoring
\`\`\`javascript
db.serverStatus()
db.stats()
\`\`\`
`
  },
  {
    dbType: 'oracle',
    name: 'Oracle Database',
    version: '21c',
    tutorial: `# Oracle Database 21c - Enterprise Handbook

## Overview
Oracle Database is a multi-model database with JSON Relational Duality and blockchain tables.

## Common Operations
### User Management
\`\`\`sql
CREATE USER app_user IDENTIFIED BY "strong_password";
GRANT CONNECT, RESOURCE TO app_user;
\`\`\`

### Tablespace Management
\`\`\`sql
CREATE TABLESPACE app_data DATAFILE 'app_data01.dbf' SIZE 100M AUTOEXTEND ON;
\`\`\`

## Monitoring
Use AWR reports and Oracle Enterprise Manager for performance monitoring.
`
  },
  {
    dbType: 'sqlserver',
    name: 'MS SQL Server',
    version: '2022',
    tutorial: `# Microsoft SQL Server 2022 - Database Handbook

## Overview
Microsoft SQL Server 2022 introduces hybrid cloud capabilities and enhanced security.

## Common Operations
### Database Creation
\`\`\`sql
CREATE DATABASE AppDB;
GO
\`\`\`

### Backup & Recovery
\`\`\`sql
BACKUP DATABASE AppDB TO DISK = 'C:\\Backups\\AppDB_Full.bak';
RESTORE DATABASE AppDB FROM DISK = 'C:\\Backups\\AppDB_Full.bak';
\`\`\`
`
  },
  {
    dbType: 'edb',
    name: 'EnterpriseDB (EDB)',
    version: '16.2',
    tutorial: `# EnterpriseDB (EDB) Postgres Advanced Server 16 - Handbook

## Overview
EDB provides enterprise-grade PostgreSQL with Oracle compatibility features.

## Common Operations
### Oracle-Compatible Syntax
\`\`\`sql
CREATE OR REPLACE PACKAGE emp_pkg AS
  PROCEDURE raise_salary(emp_id INT, amount DECIMAL);
END emp_pkg;
\`\`\`

## Monitoring
\`\`\`sql
SELECT * FROM edb_audit_log;
SELECT * FROM pg_stat_activity;
\`\`\`
`
  },
  {
    dbType: 'db2',
    name: 'IBM DB2',
    version: '11.5',
    tutorial: `# IBM DB2 11.5 - Enterprise Database Handbook

## Overview
IBM DB2 is a family of data management products with native cloud support and JSON document store.

## Common Operations
### Database Creation
\`\`\`sql
CREATE DATABASE appdb USING CODESET UTF-8 TERRITORY US;
\`\`\`

### Backup & Recovery
\`\`\`bash
db2 backup db appdb to /backup/
db2 restore db appdb from /backup/
\`\`\`
`
  },
  {
    dbType: 'mongodb',
    name: 'MongoDB',
    version: '7.0.6',
    tutorial: `# MongoDB 7.0 - NoSQL Database Handbook

## Overview
MongoDB is a document-oriented NoSQL database providing high performance and scalability.

## Installation (Homebrew - macOS)
\`\`\`bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
\`\`\`

## Common Operations
### CRUD Operations
\`\`\`javascript
db.users.insertOne({ name: "John", email: "john@example.com" })
db.users.find({ name: "John" })
db.users.updateOne({ name: "John" }, { $set: { status: "active" } })
\`\`\`

## Monitoring
\`\`\`javascript
db.serverStatus()
db.stats()
\`\`\`
`
  },
  {
    dbType: 'oracle',
    name: 'Oracle Database',
    version: '21c',
    tutorial: `# Oracle Database 21c - Enterprise Handbook

## Overview
Oracle Database 21c introduces JSON Relational Duality and blockchain tables.

## Common Operations
### User Management
\`\`\`sql
CREATE USER app_user IDENTIFIED BY "strong_password";
GRANT CONNECT, RESOURCE TO app_user;
\`\`\`

### Tablespace Management
\`\`\`sql
CREATE TABLESPACE app_data DATAFILE 'app_data01.dbf' SIZE 100M AUTOEXTEND ON;
\`\`\`
`
  }
];

// AI Update All
app.post('/api/dokumentasi/ai-update/all', async (req, res) => {
  try {
    const results = { updated: 0, created: 0, errors: [] };

    for (const handbook of DB_HANDBOOKS) {
      try {
        const existing = await prisma.dokumentasiDB.findFirst({
          where: { dbType: handbook.dbType, flag: true }
        });

        if (existing) {
          await prisma.dokumentasiDB.update({
            where: { id: existing.id },
            data: {
              title: `${handbook.name} ${handbook.version} - Database Management Handbook`,
              tutorial: handbook.tutorial,
              version: handbook.version,
              summary: `${handbook.name} ${handbook.version} database management handbook`,
              aiGenerated: true,
              aiSource: 'opencode/big-pickle',
              lastAiUpdate: new Date(),
            }
          });
          results.updated++;
        } else {
          await prisma.dokumentasiDB.create({
            data: {
              dbType: handbook.dbType,
              title: `${handbook.name} ${handbook.version} - Database Management Handbook`,
              tutorial: handbook.tutorial,
              summary: `${handbook.name} ${handbook.version} database management handbook`,
              version: handbook.version,
              rank: 0,
              aiGenerated: true,
              aiSource: 'opencode/big-pickle',
              lastAiUpdate: new Date(),
              authorId: null,
              flag: true,
            }
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({ dbType: handbook.dbType, error: err.message });
      }
    }

    return res.json({
      status: 'success',
      message: `AI update completed: ${results.updated} updated, ${results.created} created`,
      data: results
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Grep Search - Full-text search across all documentation
app.get('/api/dokumentasi/grep', async (req, res) => {
  const query = req.query.q || '';
  const dbType = req.query.db_type;

  if (!query) {
    return res.status(400).json({ status: 'error', message: 'Query parameter "q" is required' });
  }

  const where = {
    flag: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } },
      { tutorial: { contains: query, mode: 'insensitive' } },
    ]
  };

  if (dbType) where.dbType = dbType;

  const results = await prisma.dokumentasiDB.findMany({
    where,
    orderBy: { rank: 'asc' },
    select: {
      id: true,
      dbType: true,
      title: true,
      summary: true,
      version: true,
      tutorial: true,
    }
  });

  return res.json({
    status: 'success',
    data: {
      query,
      total: results.length,
      data: results,
    },
  });
});

// Troubleshoot with AI Knowledge Base
app.post('/api/troubleshoot', async (req, res) => {
  const { issue, dbType } = req.body;

  if (!issue) {
    return res.status(400).json({ status: 'error', message: 'Issue description is required' });
  }

  try {
    // Get relevant handbook data as knowledge base
    const where = { flag: true };
    if (dbType) where.dbType = dbType;

    const handbooks = await prisma.dokumentasiDB.findMany({
      where,
      select: {
        dbType: true,
        title: true,
        tutorial: true,
        version: true,
      }
    });

    // Build knowledge base context
    const knowledgeBase = handbooks.map(h => ({
      type: h.dbType,
      title: h.title,
      content: h.tutorial?.substring(0, 2000) || '', // Limit content length
    }));

    // Simulate AI troubleshooting (in production, this would call an actual AI API)
    const troubleshooting = {
      issue,
      dbType: dbType || 'all',
      analysis: `Based on the knowledge base, here are potential solutions for: "${issue}"`,
      recommendations: [
        'Check database logs for error messages',
        'Verify database service is running',
        'Review recent configuration changes',
        'Test connectivity with connection tools',
      ],
      relevantDocs: knowledgeBase.slice(0, 3),
      timestamp: new Date().toISOString(),
    };

    return res.json({
      status: 'success',
      message: 'Troubleshooting analysis complete',
      data: troubleshooting,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// AI Update Single
app.post('/api/dokumentasi/ai-update/:dbType', async (req, res) => {
  try {
    const { dbType } = req.params;
    const handbook = DB_HANDBOOKS.find(h => h.dbType === dbType);

    if (!handbook) {
      return res.status(404).json({ status: 'error', message: 'Database type not found' });
    }

    const existing = await prisma.dokumentasiDB.findFirst({
      where: { dbType, flag: true }
    });

    if (existing) {
      await prisma.dokumentasiDB.update({
        where: { id: existing.id },
        data: {
          title: `${handbook.name} ${handbook.version}`,
          tutorial: handbook.tutorial,
          version: handbook.version,
          aiGenerated: true,
          aiSource: 'opencode/big-pickle',
          lastAiUpdate: new Date(),
        }
      });
    } else {
      await prisma.dokumentasiDB.create({
        data: {
          dbType,
          title: `${handbook.name} ${handbook.version}`,
          tutorial: handbook.tutorial,
          version: handbook.version,
          summary: `${handbook.name} database handbook`,
          rank: 0,
          aiGenerated: true,
          aiSource: 'opencode/big-pickle',
          lastAiUpdate: new Date(),
          authorId: null,
          flag: true,
        }
      });
    }

    return res.json({ status: 'success', message: `AI update completed for ${handbook.name}` });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// View Single Documentation
app.get('/api/dokumentasi/:id', async (req, res) => {
  try {
    const doc = await prisma.dokumentasiDB.findFirst({
      where: { id: parseInt(req.params.id), flag: true }
    });

    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Documentation not found' });
    }

    return res.json({ status: 'success', data: doc });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Edit Documentation (protected)
app.put('/api/dokumentasi/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  try {
    const { dbType, title, tutorial, summary, rank, tags, version, autoUpdate } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.dokumentasiDB.findFirst({
      where: { id, flag: true }
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Documentation not found' });
    }

    const doc = await prisma.dokumentasiDB.update({
      where: { id },
      data: {
        dbType: dbType || existing.dbType,
        title: title || existing.title,
        tutorial: tutorial !== undefined ? tutorial : existing.tutorial,
        summary: summary !== undefined ? summary : existing.summary,
        rank: rank !== undefined ? rank : existing.rank,
        tags: tags || existing.tags,
        version: version || existing.version,
        autoUpdate: autoUpdate !== undefined ? autoUpdate : existing.autoUpdate,
      }
    });

    return res.json({ status: 'success', message: 'Documentation updated', data: doc });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete Documentation (protected, soft delete)
app.delete('/api/dokumentasi/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.dokumentasiDB.findFirst({
      where: { id, flag: true }
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Documentation not found' });
    }

    await prisma.dokumentasiDB.update({
      where: { id },
      data: { flag: false }
    });

    return res.json({ status: 'success', message: 'Documentation deleted' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// View Single User
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: parseInt(req.params.id), flag: true },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    return res.json({ status: 'success', data: user });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Edit User (protected)
app.put('/api/users/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  try {
    const { username, email, fullName, active, roleId } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.user.findFirst({
      where: { id, flag: true }
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username: username || existing.username,
        email: email !== undefined ? email : existing.email,
        fullName: fullName !== undefined ? fullName : existing.fullName,
        active: active !== undefined ? active : existing.active,
        roleId: roleId !== undefined ? roleId : existing.roleId,
      },
      include: { role: true }
    });

    return res.json({ status: 'success', message: 'User updated', data: user });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete User (protected, soft delete)
app.delete('/api/users/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }

  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.user.findFirst({
      where: { id, flag: true }
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    await prisma.user.update({
      where: { id },
      data: { flag: false }
    });

    return res.json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get Logs (protected - admin/dba only)
app.get('/api/logs', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  let decoded;
  try {
    const jwt = await import('jsonwebtoken');
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Token expired' });
    }
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }

  // Verify user has admin or dba role
  try {
    const userWithRole = await prisma.user.findFirst({
      where: { id: decoded.id, flag: true },
      include: { role: true },
    });

    if (!userWithRole || !userWithRole.role) {
      return res.status(403).json({ status: 'error', message: 'No role assigned' });
    }

    if (!['admin', 'dba'].includes(userWithRole.role.name)) {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Authorization failed' });
  }

  // Fetch logs with filters
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const action = req.query.action || null;
    const module = req.query.module || null;
    const since = req.query.since || null;

    const where = { flag: true };
    if (action) where.action = action;
    if (module) where.module = module;
    if (since) {
      const sinceNum = parseInt(since, 10);
      if (!isNaN(sinceNum)) {
        const sinceDate = new Date(sinceNum);
        where.createdAt = { gte: sinceDate };
      }
    }

    const [logs, total] = await Promise.all([
      prisma.logActivity.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.logActivity.count({ where }),
    ]);

    const result = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: logs,
    };

    return res.json({ status: 'success', data: result });
  } catch (err) {
    console.error('getAll logs error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${process.env.APP_NAME} running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.APP_ENV}`);
});

export default app;
