/**
 * seed_docs.js
 * Reads tutorial files from ../../tutorial-redis-mysql/
 * and inserts them into dokumentasi_db table.
 *
 * Usage: node src/database/seed_docs.js
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { connectDB } = require('../config/database');
const { RunbookAI } = require('../models/index');
const logger = require('../utils/logger');

// ─── Tutorial file definitions ────────────────────────────
// Each entry maps a file → db_type, title, rank, tags
const TUTORIAL_DIR = path.join(__dirname, '..', '..', '..', 'tutorial-redis-mysql');

const FILES = [
  {
    file:    'doc_mysql.md',
    db_type: 'mysql',
    title:   'MySQL Configuration & User Management',
    summary: 'MySQL configuration parameters, user creation, privilege management, and monitoring variables via Homebrew on macOS.',
    rank:    1,
    tags:    ['mysql', 'configuration', 'user-management', 'monitoring', 'homebrew'],
  },
  {
    file:    'backup_db_mysql.md',
    db_type: 'mysql',
    title:   'MySQL Backup & Recovery with mysqldump',
    summary: 'Full database backup using mysqldump with triggers, routines, events, and single-transaction options.',
    rank:    2,
    tags:    ['mysql', 'backup', 'mysqldump', 'recovery', 'dba'],
  },
  {
    file:    'install_mysql.sh',
    db_type: 'mysql',
    title:   'MySQL Service Manager Script (Homebrew)',
    summary: 'Shell script to start, stop, restart, and check status of MySQL service via Homebrew. Includes root password setup.',
    rank:    3,
    tags:    ['mysql', 'shell', 'service', 'homebrew', 'automation'],
  },
  {
    file:    'install_redis.sh',
    db_type: 'redis',
    title:   'Redis Installation & ACL Setup Script',
    summary: 'Automated Redis installation via Homebrew, password configuration, ACL user creation, and bind address setup.',
    rank:    4,
    tags:    ['redis', 'installation', 'acl', 'security', 'homebrew', 'automation'],
  },
  {
    file:    'install_toolkit.sh',
    db_type: 'other',
    title:   'DBA Toolkit Installation (Termius)',
    summary: 'Script to install DBA toolkit including Termius SSH client via Homebrew Cask.',
    rank:    5,
    tags:    ['toolkit', 'termius', 'ssh', 'homebrew', 'tools'],
  },
  {
    file:    'error_log.mysq',
    db_type: 'mysql',
    title:   'MySQL Error Log Reference',
    summary: 'MySQL error log entries and troubleshooting reference for common issues.',
    rank:    6,
    tags:    ['mysql', 'error-log', 'troubleshooting', 'debugging'],
  },
];

const seed = async () => {
  try {
    await connectDB();
    logger.info('Starting dokumentasi seed from tutorial files...');

    let inserted = 0;
    let skipped  = 0;

    for (const entry of FILES) {
      const filePath = path.join(TUTORIAL_DIR, entry.file);

      // Read file content
      let content = '';
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf8').trim();
      } else {
        logger.warn(`File not found, skipping: ${filePath}`);
        skipped++;
        continue;
      }

      // Wrap shell scripts in markdown code block for display
      const ext = path.extname(entry.file);
      let tutorial = content;
      if (ext === '.sh') {
        tutorial = `# ${entry.title}\n\n\`\`\`bash\n${content}\n\`\`\``;
      } else if (ext === '.mysq' || ext === '.log') {
        tutorial = `# ${entry.title}\n\n\`\`\`\n${content}\n\`\`\``;
      }

      // Upsert: update if title exists, create if not
      const [doc, created] = await RunbookAI.findOrCreate({
        where: { title: entry.title },
        defaults: {
          db_type:  entry.db_type,
          title:    entry.title,
          tutorial: tutorial,
          summary:  entry.summary,
          rank:     entry.rank,
          tags:     entry.tags,
          flag:     1,
        },
      });

      if (!created) {
        // Update existing with fresh content
        await doc.update({
          db_type:  entry.db_type,
          tutorial: tutorial,
          summary:  entry.summary,
          rank:     entry.rank,
          tags:     entry.tags,
          flag:     1,
        });
        logger.info(`  Updated: [${entry.db_type}] ${entry.title}`);
      } else {
        logger.info(`  Inserted: [${entry.db_type}] ${entry.title}`);
        inserted++;
      }
    }

    logger.info(`Done. Inserted: ${inserted}, Updated: ${FILES.length - inserted - skipped}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    logger.error('seed_docs failed:', err.message);
    logger.error(err.stack);
    process.exit(1);
  }
};

seed();
