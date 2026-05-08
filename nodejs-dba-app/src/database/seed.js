require('dotenv').config();
const { connectDB } = require('../config/database');
const { User, Role, RunbookAI } = require('../models/index');
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

    // Seed RunbookAI
    await RunbookAI.findOrCreate({
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

    await RunbookAI.findOrCreate({
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

    await RunbookAI.findOrCreate({
      where: { title: 'Banking Systems Security Best Practices' },
      defaults: {
        db_type: 'banking',
        tutorial: `# Banking Systems Security Best Practices\n\n## Overview\nThis document outlines security best practices for banking systems and financial applications.\n\n## Authentication & Authorization\n- Implement multi-factor authentication (MFA) for all user access\n- Use role-based access control (RBAC) with least privilege principles\n- Regularly review and update access permissions\n- Implement session timeout and secure logout mechanisms\n\n## Data Encryption\n- Encrypt sensitive data at rest using AES-256 or stronger\n- Use TLS 1.2+ for all data in transit\n- Implement proper key management procedures\n- Regularly rotate encryption keys\n\n## Audit & Monitoring\n- Implement comprehensive logging of all system activities\n- Monitor for suspicious activities and anomalies\n- Regular security audits and penetration testing\n- Real-time alerting for security events\n\n## Data Backup & Recovery\n- Regular automated backups of critical data\n- Test backup restoration procedures regularly\n- Implement geographic redundancy for disaster recovery\n- Ensure backup data is equally protected as primary data\n\n## Compliance & Regulations\n- Stay updated with PCI DSS, GDPR, SOX, and other relevant regulations\n- Regular compliance assessments and documentation\n- Implement data retention and disposal policies\n\n## Network Security\n- Use firewalls and intrusion detection/prevention systems\n- Implement network segmentation for sensitive systems\n- Regular vulnerability assessments and patch management\n- Secure API gateways for third-party integrations\n\n## Application Security\n- Conduct regular code reviews and security testing\n- Implement input validation and output encoding\n- Use secure coding practices to prevent common vulnerabilities\n- Regular dependency scanning and updates\n\n## Incident Response\n- Develop and maintain incident response plan\n- Regular incident response training and drills\n- Clear communication procedures during security incidents\n- Post-incident analysis and improvement process`,
        summary: 'Comprehensive security best practices for banking systems and financial applications.',
        rank: 1,
        tags: ['banking', 'security', 'compliance', 'best-practices'],
        flag: 1,
      },
    });

    logger.info('RunbookAI seeded.');
    logger.info('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
