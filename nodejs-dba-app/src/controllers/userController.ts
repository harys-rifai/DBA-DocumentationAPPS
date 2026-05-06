import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
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
};

export const getById = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { role: true },
  });

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  return res.json({ status: 'success', data: user });
};

export const create = async (req: Request, res: Response) => {
  const { username, email, fullName, password, active, roleId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      fullName,
      password: hashedPassword,
      active: active ?? true,
      roleId,
    },
    include: { role: true },
  });

  return res.status(201).json({ status: 'success', message: 'User created', data: user });
};

export const update = async (req: Request, res: Response) => {
  const { username, email, fullName, password, active, roleId } = req.body;
  const id = parseInt(req.params.id);

  const data: any = { username, email, fullName, active, roleId };
  if (password) {
    data.password = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  return res.json({ status: 'success', message: 'User updated', data: user });
};

export const remove = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  await prisma.user.update({
    where: { id },
    data: { flag: false },
  });

  return res.json({ status: 'success', message: 'User deleted' });
};
