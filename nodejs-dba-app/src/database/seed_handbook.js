require('dotenv').config();
const { sequelize } = require('../config/database');
const RunbookAI = require('../models/DocumentasiDB');
const logger = require('../utils/logger');

const HANDBOOK_DATA = [
  {
    db_type: 'mysql',
    title: 'MySQL 8.0 - Database Management Handbook',
    tutorial: `# MySQL 8.0 - Database Management Handbook

## Overview
MySQL is the world's most popular open-source relational database management system. This handbook covers MySQL 8.0 administration and management.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install mysql
brew services start mysql
mysql_secure_installation
\`\`\`

## Common Operations

### Backup & Recovery
\`\`\`bash
# Backup
mysqldump -u root -p --all-databases > backup_$(date +%Y%m%d).sql

# Restore
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
SHOW VARIABLES LIKE 'max_connections';
\`\`\`

## Version History
- MySQL 8.0.36 (Current)
- MySQL 8.0.x series continues active development
`,
    summary: 'Complete MySQL 8.0 database administration handbook covering installation, backup, user management, and performance tuning',
    tags: ['mysql', 'database', 'administration', 'handbook', 'homebrew'],
    rank: 10,
    version: '8.0.36',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL 16 - Database Management Handbook',
    tutorial: `# PostgreSQL 16 - Database Management Handbook

## Overview
PostgreSQL is an advanced, enterprise-class open-source relational database. This handbook covers PostgreSQL 16 administration.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install postgresql@16
brew services start postgresql@16
createdb $(whoami)
\`\`\`

## Common Operations

### Backup & Recovery
\`\`\`bash
# Backup
pg_dump -U postgres dbname > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d dbname < backup_20240101.sql
\`\`\`

### User Management
\`\`\`sql
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
\`\`\`

### Performance Tuning
- Adjust \`shared_buffers\` (25% of RAM)
- Configure \`effective_cache_size\`
- Enable query logging for analysis

## Monitoring
\`\`\`sql
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_database;
\`\`\`

## Version History
- PostgreSQL 16.2 (Current)
- PostgreSQL 16.x series continues active development
`,
    summary: 'Complete PostgreSQL 16 database administration handbook with installation, backup, and performance tuning guidance',
    tags: ['postgresql', 'postgres', 'database', 'administration', 'handbook'],
    rank: 20,
    version: '16.2',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'redis',
    title: 'Redis 7.2 - In-Memory Database Handbook',
    tutorial: `# Redis 7.2 - In-Memory Database Handbook

## Overview
Redis is an open-source, in-memory data structure store used as a database, cache, and message broker. This handbook covers Redis 7.2.

## Installation (Homebrew - macOS)
\`\`\`bash
brew install redis
brew services start redis
redis-cli ping  # Should return PONG
\`\`\`

## Common Operations

### Data Types & Commands
\`\`\`bash
# Strings
SET key "value"
GET key

# Lists
LPUSH mylist "item"
LRANGE mylist 0 -1

# Hashes
HSET user:1 name "John" email "john@example.com"
HGETALL user:1
\`\`\`

### Persistence
- RDB (Snapshotting): \`save 900 1\`
- AOF (Append Only File): \`appendonly yes\`

### Security (Redis 6+ ACL)
\`\`\`bash
redis-cli
ACL SETUSER appuser on >password ~* &* +@all
ACL SAVE
\`\`\`

## Monitoring
\`\`\`bash
redis-cli INFO memory
redis-cli INFO stats
redis-cli MONITOR  # Real-time commands
\`\`\`

## Version History
- Redis 7.2.4 (Current)
- Redis 7.x series with improved ACL and clustering
`,
    summary: 'Complete Redis 7.2 handbook covering installation, data types, persistence, security, and monitoring',
    tags: ['redis', 'nosql', 'cache', 'in-memory', 'handbook'],
    rank: 30,
    version: '7.2.4',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'mongodb',
    title: 'MongoDB 7.0 - NoSQL Database Handbook',
    tutorial: `# MongoDB 7.0 - NoSQL Database Handbook

## Overview
MongoDB is a document-oriented NoSQL database that provides high performance, high availability, and easy scalability.

## Installation (Homebrew - macOS)
\`\`\`bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
\`\`\`

## Common Operations

### CRUD Operations
\`\`\`javascript
// Insert
db.users.insertOne({ name: "John", email: "john@example.com" })

// Find
db.users.find({ name: "John" })

// Update
db.users.updateOne({ name: "John" }, { $set: { status: "active" } })

// Delete
db.users.deleteOne({ name: "John" })
\`\`\`

### Indexing
\`\`\`javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.getIndexes()
\`\`\`

### Backup & Recovery
\`\`\`bash
mongodump --uri="mongodb://localhost:27017" --out=/backup/
mongorestore --uri="mongodb://localhost:27017" /backup/
\`\`\`

## Monitoring
\`\`\`javascript
db.serverStatus()
db.stats()
\`\`\`

## Version History
- MongoDB 7.0.6 (Current)
- MongoDB 7.x series with improved query performance
`,
    summary: 'Complete MongoDB 7.0 NoSQL database handbook covering document operations, indexing, and administration',
    tags: ['mongodb', 'nosql', 'document-database', 'handbook'],
    rank: 40,
    version: '7.0.6',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'oracle',
    title: 'Oracle Database 21c - Enterprise Handbook',
    tutorial: `# Oracle Database 21c - Enterprise Handbook

## Overview
Oracle Database is a multi-model database management system produced by Oracle Corporation. Version 21c introduces many new features.

## Key Features in 21c
- JSON Relational Duality
- Blockchain Tables
- Native Kubernetes support
- Enhanced in-memory capabilities

## Common Operations

### User Management
\`\`\`sql
CREATE USER app_user IDENTIFIED BY "strong_password";
GRANT CONNECT, RESOURCE TO app_user;
GRANT CREATE SESSION TO app_user;
\`\`\`

### Tablespace Management
\`\`\`sql
CREATE TABLESPACE app_data 
  DATAFILE 'app_data01.dbf' SIZE 100M AUTOEXTEND ON;
\`\`\`

### Backup (RMAN)
\`\`\`bash
rman target /
RMAN> BACKUP DATABASE PLUS ARCHIVELOG;
RMAN> LIST BACKUP;
\`\`\`

## Performance Tuning
- Use AWR (Automatic Workload Repository) reports
- Monitor with Oracle Enterprise Manager
- Configure SGA and PGA appropriately

## Version History
- Oracle Database 21c (Current)
- Long Term Support: Oracle 19c
`,
    summary: 'Oracle Database 21c enterprise handbook covering user management, tablespaces, RMAN backup, and performance tuning',
    tags: ['oracle', 'database', 'enterprise', 'rman', 'handbook'],
    rank: 50,
    version: '21c',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'sqlserver',
    title: 'Microsoft SQL Server 2022 - Database Handbook',
    tutorial: `# Microsoft SQL Server 2022 - Database Handbook

## Overview
Microsoft SQL Server is a relational database management system developed by Microsoft. SQL Server 2022 introduces new hybrid and cloud capabilities.

## Key Features in 2022
- Azure SQL integration
- Enhanced security features
- Improved query performance
- Distributed availability groups

## Common Operations

### Database Creation
\`\`\`sql
CREATE DATABASE AppDB;
GO
USE AppDB;
GO
\`\`\`

### User Management
\`\`\`sql
CREATE LOGIN app_user WITH PASSWORD = 'StrongPassword123!';
CREATE USER app_user FOR LOGIN app_user;
EXEC sp_addrolemember 'db_owner', 'app_user';
\`\`\`

### Backup & Recovery
\`\`\`sql
-- Full Backup
BACKUP DATABASE AppDB 
TO DISK = 'C:\\Backups\\AppDB_Full.bak'
WITH FORMAT;

-- Restore
RESTORE DATABASE AppDB 
FROM DISK = 'C:\\Backups\\AppDB_Full.bak'
WITH REPLACE;
\`\`\`

## Monitoring
\`\`\`sql
SELECT * FROM sys.dm_exec_requests;
SELECT * FROM sys.dm_os_performance_counters;
\`\`\`

## Version History
- SQL Server 2022 (Current)
- Previous: SQL Server 2019
`,
    summary: 'Microsoft SQL Server 2022 handbook covering database management, T-SQL operations, backup, and Azure integration',
    tags: ['sqlserver', 'mssql', 'microsoft', 'database', 'handbook'],
    rank: 60,
    version: '2022',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'edb',
    title: 'EnterpriseDB (EDB) Postgres Advanced Server 16 - Handbook',
    tutorial: `# EnterpriseDB (EDB) Postgres Advanced Server 16 - Handbook

## Overview
EnterpriseDB (EDB) provides enterprise-grade PostgreSQL with Oracle compatibility features. EDB Postgres Advanced Server extends PostgreSQL.

## Key Features
- Oracle database compatibility
- Enhanced security (EUS)
- Advanced partitioning
- Dynamic runtime parameters

## Installation
\`\`\`bash
# EDB installs via their installer or cloud marketplace
# For evaluation, use EDB's official installer
\`\`\`

## Common Operations

### Oracle-Compatible Syntax
\`\`\`sql
-- Oracle-style packages
CREATE OR REPLACE PACKAGE emp_pkg AS
  PROCEDURE raise_salary(emp_id INT, amount DECIMAL);
END emp_pkg;
\`\`\`

### Backup (pg_dump enhanced)
\`\`\`bash
edb_dump -U enterprisedb dbname > backup.sql
\`\`\`

### User Management
\`\`\`sql
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE app_db TO app_user;
\`\`\`

## Monitoring
\`\`\`sql
SELECT * FROM edb_audit_log;
SELECT * FROM pg_stat_activity;
\`\`\`

## Version History
- EDB Postgres Advanced Server 16 (Current)
- Based on PostgreSQL 16 with enterprise extensions
`,
    summary: 'EnterpriseDB (EDB) Postgres Advanced Server handbook with Oracle compatibility and enterprise features',
    tags: ['edb', 'enterprisedb', 'postgresql', 'oracle-compat', 'handbook'],
    rank: 70,
    version: '16',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
  {
    db_type: 'db2',
    title: 'IBM DB2 11.5 - Enterprise Database Handbook',
    tutorial: `# IBM DB2 11.5 - Enterprise Database Handbook

## Overview
IBM DB2 is a family of data management products, including database servers, developed by IBM. Version 11.5 includes many enhancements.

## Key Features in 11.5
- Native cloud support
- JSON document store
- Advanced analytics integration
- Machine learning integration

## Common Operations

### Database Creation
\`\`\`sql
CREATE DATABASE appdb 
  USING CODESET UTF-8 
  TERRITORY US 
  COLLATE USING SYSTEM;
\`\`\`

### User Management
\`\`\`sql
CREATE USER app_user 
  IDENTIFIED BY "strong_password"
  GROUP DB2USERS;
GRANT CONNECT ON DATABASE TO app_user;
\`\`\`

### Backup & Recovery
\`\`\`bash
# Offline backup
db2 backup db appdb to /backup/

# Online backup
db2 backup db appdb online to /backup/

# Restore
db2 restore db appdb from /backup/
\`\`\`

## Monitoring
\`\`\`sql
SELECT * FROM SYSIBMADM.MON_DB_SUMMARY;
SELECT * FROM SYSIBMADM.MON_CONNECTIONS;
\`\`\`

## Version History
- IBM DB2 11.5 (Current)
- Continuous fix pack updates available
`,
    summary: 'IBM DB2 11.5 enterprise database handbook covering database administration, backup, and monitoring',
    tags: ['db2', 'ibm', 'enterprise', 'database', 'handbook'],
    rank: 80,
    version: '11.5',
    ai_generated: 0,
    auto_update: 1,
    flag: 1,
  },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to database.');

    for (const data of HANDBOOK_DATA) {
      const [doc, created] = await RunbookAI.findOrCreate({
        where: { db_type: data.db_type, title: data.title },
        defaults: data,
      });
      
      if (!created) {
        await doc.update(data);
        logger.info(`Updated: ${data.db_type} handbook`);
      } else {
        logger.info(`Created: ${data.db_type} handbook`);
      }
    }

    logger.info('✅ Handbook seed completed successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
