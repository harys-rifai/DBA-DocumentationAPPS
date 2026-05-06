import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const seed = async () => {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: JSON.stringify(['all']),
    },
  });

  const dbaRole = await prisma.role.upsert({
    where: { name: 'dba' },
    update: {},
    create: {
      name: 'dba',
      description: 'Database administrator',
      permissions: JSON.stringify(['read', 'write:dokumentasi']),
    },
  });

  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with read-only access',
      permissions: JSON.stringify(['read']),
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('Password09', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      fullName: 'Admin User',
      active: true,
      roleId: adminRole.id,
    },
  });

  // Create dba user
  const dbaPassword = await bcrypt.hash('Password09', 12);
  await prisma.user.upsert({
    where: { username: 'dba_user' },
    update: { password: dbaPassword },
    create: {
      username: 'dba_user',
      password: dbaPassword,
      email: 'dba@example.com',
      fullName: 'DBA User',
      active: true,
      roleId: dbaRole.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  await prisma.$disconnect();
};

seed().catch(async (e) => {
  console.error('Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
