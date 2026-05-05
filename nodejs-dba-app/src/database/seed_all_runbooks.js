/**
 * seed_all_runbooks.js
 * Inserts 100 database runbook/documentation entries for each database type
 * (oracle, redis, postgresql, sqlserver) into dokumentasi_db.
 * MySQL already has 100 entries in seed_runbook100.js.
 *
 * Usage: node src/database/seed_all_runbooks.js
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const { RunbookAI } = require('../models/index');
const logger = require('../utils/logger');

// Database types to seed (excluding mysql)
const DB_TYPES = ['oracle', 'redis', 'postgresql', 'sqlserver'];

// Generate 100 entries for each db_type
const DOCS = [];

let rankCounter = 1;

for (const dbType of DB_TYPES) {
    for (let i = 1; i <= 100; i++) {
        const title = `${dbType.charAt(0).toUpperCase() + dbType.slice(1)} Runbook ${i}`;
        const summary = `Runbook entry ${i} for ${dbType} database administration, covering installation, configuration, monitoring, and backup procedures.`;
        let tutorial = `# ${title}

## Overview
This runbook provides administrative guidance for ${dbType} databases.

## Installation
Steps to install ${dbType} on RHEL Linux and Windows Server.

## Configuration
Key configuration parameters for optimal performance.

## Monitoring
Essential metrics to monitor for ${dbType} health.

## Backup and Recovery
Recommended backup strategies and recovery procedures.

## Troubleshooting
Common issues and resolutions for ${dbType}.`;
        // Add db_type specific content
        if (dbType === 'oracle') {
            tutorial += `\n\n## Oracle Specifics\n- RMAN backup scripts\n- Data Guard configuration\n- AWR report generation`;
        } else if (dbType === 'redis') {
            tutorial += `\n\n## Redis Specifics\n- ACL user management\n- Persistence configuration\n- Cluster setup`;
        } else if (dbType === 'postgresql') {
            tutorial += `\n\n## PostgreSQL Specifics\n- pg_dump and pg_restore usage\n- Streaming replication\n- Vacuum tuning`;
        } else if (dbType === 'sqlserver') {
            tutorial += `\n\n## SQL Server Specifics\n- SQL Server Agent jobs\n- Always On Availability Groups\n- Index maintenance`;
        }
        const tags = [dbType, 'runbook', 'administration', 'rhel', 'windows'];

        DOCS.push({
            db_type: dbType,
            title,
            summary,
            tutorial,
            rank: rankCounter++,
            tags,
        });
    }
}

const seed = async () => {
    try {
        await connectDB();
        logger.info(`Starting seed_all_runbooks — ${DOCS.length} entries...`);
        let inserted = 0, updated = 0;

        for (const entry of DOCS) {
            const [doc, created] = await RunbookAI.findOrCreate({
                where: { title: entry.title },
                defaults: { ...entry, flag: 1 },
            });

            if (!created) {
                // Update existing with fresh content
                await doc.update({ ...entry, flag: 1 });
                updated++;
            } else {
                inserted++;
            }
        }

        logger.info(`Done. Inserted: ${inserted}, Updated: ${updated}`);
        process.exit(0);
    } catch (err) {
        logger.error('seed_all_runbooks failed:', err.message);
        logger.error(err.stack);
        process.exit(1);
    }
};

seed();