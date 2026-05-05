require('dotenv').config();
const { connectDB } = require('../config/database');
const { User, Role, DocumentasiDB } = require('../models/index');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    await connectDB();

    // Seed Roles
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'Administrator with full access',
        permissions: ['read', 'write', 'delete', 'manage'],
        flag: 1,
      },
    });

    const [dbaRole] = await Role.findOrCreate({
      where: { name: 'dba' },
      defaults: {
        description: 'Database Administrator',
        permissions: ['read', 'write', 'manage_db'],
        flag: 1,
      },
    });

    await Role.findOrCreate({
      where: { name: 'viewer' },
      defaults: {
        description: 'Read-only access',
        permissions: ['read'],
        flag: 1,
      },
    });

    logger.info('Roles seeded.');

    // Seed Admin User
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        password: 'Password09',
        email: 'admin@example.com',
        full_name: 'System Administrator',
        active: 1,
        role_id: adminRole.id,
        flag: 1,
      },
    });

    await User.findOrCreate({
      where: { username: 'dba_user' },
      defaults: {
        password: 'Password09',
        email: 'dba@example.com',
        full_name: 'DBA User',
        active: 1,
        role_id: dbaRole.id,
        flag: 1,
      },
    });

    logger.info('Users seeded.');

    // Seed DocumentasiDB
    await DocumentasiDB.findOrCreate({
      where: { title: 'MySQL Installation & Configuration' },
      defaults: {
        db_type: 'mysql',
        tutorial: `# MySQL Installation via Homebrew\n\n## Install\n\`\`\`bash\nbrew install mysql\nbrew services start mysql\n\`\`\`\n\n## Secure Installation\n\`\`\`bash\nmysql_secure_installation\n\`\`\`\n\n## Config Location\n- \`/opt/homebrew/etc/my.cnf\`\n\n## Key Parameters\n- \`innodb_buffer_pool_size=512M\`\n- \`max_connections=200\`\n- \`slow_query_log=1\``,
        summary: 'Step-by-step MySQL installation and configuration on macOS via Homebrew.',
        rank: 1,
        tags: ['mysql', 'installation', 'homebrew', 'macos'],
        flag: 1,
      },
    });

    await DocumentasiDB.findOrCreate({
      where: { title: 'Redis Installation & Configuration' },
      defaults: {
        db_type: 'redis',
        tutorial: `# Redis Installation via Homebrew\n\n## Install\n\`\`\`bash\nbrew install redis\nbrew services start redis\n\`\`\`\n\n## Config Location\n- \`/opt/homebrew/etc/redis.conf\`\n\n## Key Parameters\n- \`requirepass Password09\`\n- \`maxmemory 256mb\`\n- \`maxmemory-policy allkeys-lru\`\n- \`appendonly yes\``,
        summary: 'Step-by-step Redis installation and configuration on macOS via Homebrew.',
        rank: 2,
        tags: ['redis', 'installation', 'homebrew', 'macos'],
        flag: 1,
      },
    });

    logger.info('DocumentasiDB seeded.');
    logger.info('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
