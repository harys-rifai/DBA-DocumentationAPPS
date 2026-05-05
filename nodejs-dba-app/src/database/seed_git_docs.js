/**
 * seed_git_docs.js
 * Reads README.md files from DBA-2022-BI repository
 * and inserts them into dokumentasi_db table.
 *
 * Usage: node src/database/seed_git_docs.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, sequelize } = require('../config/database');
const { RunbookAI } = require('../models/index');
const logger = require('../utils/logger');

// ─── Repository directory ─────────────────────────────────────
const REPO_DIR = path.join(__dirname, '..', '..', '..', 'DBA-2022-BI');

// ─── Map directory name to db_type enum ───────────────────────
const DB_TYPE_MAP = {
    'Oracle': 'oracle',
    'MSSQL': 'sqlserver',
    'Postgres': 'postgresql',
    'Redis_KeyDB': 'redis',
    'MongoDB': 'mongodb',
};

// ─── Collect all README.md files ──────────────────────────────
function collectReadmeFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectReadmeFiles(fullPath));
        } else if (entry.isFile() && entry.name.toLowerCase() === 'readme.md') {
            files.push(fullPath);
        }
    }
    return files;
}

// ─── Generate title from file path ────────────────────────────
function generateTitle(filePath) {
    const relative = path.relative(REPO_DIR, filePath);
    const parts = relative.split(path.sep);
    // Remove 'README.md' and maybe parent directory if it's the same as db_type
    const titleParts = parts.slice(0, -1); // exclude filename
    // If the last part is the same as the top-level directory, we can simplify
    if (titleParts.length > 1 && titleParts[0] === titleParts[1]) {
        titleParts.shift();
    }
    // Capitalize each word
    const title = titleParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return title || 'Documentation';
}

// ─── Generate summary (first non-empty line) ─────────────────
function generateSummary(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
        // Remove leading # characters (markdown headers)
        let firstLine = lines[0].replace(/^#+\s*/, '').trim();
        // Limit length
        if (firstLine.length > 255) firstLine = firstLine.substring(0, 252) + '...';
        return firstLine;
    }
    return 'Documentation from repository';
}

// ─── Determine db_type from directory structure ───────────────
function getDbType(filePath) {
    const relative = path.relative(REPO_DIR, filePath);
    const topDir = relative.split(path.sep)[0];
    return DB_TYPE_MAP[topDir] || 'other';
}

// ─── Generate tags ────────────────────────────────────────────
function generateTags(dbType) {
    return [dbType, 'documentation', 'readme'];
}

const seed = async () => {
    try {
        await connectDB();
        logger.info('Starting git documentation seed...');

        // Convert table to utf8mb4 to support all Unicode characters
        await sequelize.query('ALTER TABLE dokumentasi_db CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        logger.info('Table dokumentasi_db converted to utf8mb4.');

        // Truncate table using raw query (faster and resets auto-increment)
        await sequelize.query('TRUNCATE TABLE dokumentasi_db');
        logger.info('Table dokumentasi_db truncated.');

        const readmeFiles = collectReadmeFiles(REPO_DIR);
        logger.info(`Found ${readmeFiles.length} README.md files.`);

        let inserted = 0;
        let rankCounter = 1;

        // Start transaction for inserts
        const transaction = await sequelize.transaction();
        try {
            for (const filePath of readmeFiles) {
                const content = fs.readFileSync(filePath, 'utf8').trim();
                if (!content) {
                    logger.warn(`Empty file, skipping: ${filePath}`);
                    continue;
                }

                const db_type = getDbType(filePath);
                const title = generateTitle(filePath);
                const summary = generateSummary(content);
                const tutorial = content; // keep as is (markdown)
                const tags = generateTags(db_type);

                // Create new entry within transaction
                await RunbookAI.create({
                    db_type,
                    title,
                    tutorial,
                    summary,
                    rank: rankCounter++,
                    tags,
                    flag: 1,
                }, { transaction });

                logger.info(`  Inserted: [${db_type}] ${title}`);
                inserted++;
            }

            await transaction.commit();
            logger.info(`Done. Inserted ${inserted} entries.`);
            process.exit(0);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        logger.error('seed_git_docs failed:', err.message);
        logger.error('Parent error:', err.parent);
        logger.error('SQL:', err.sql);
        logger.error(err.stack);
        process.exit(1);
    }
};

seed();