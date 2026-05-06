import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const prisma = new PrismaClient();

export const login = async (req: any, res: Response) => {
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

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role?.name },
    process.env.JWT_SECRET!,
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
};

export const logout = async (req: any, res: Response) => {
  return res.json({ status: 'success', message: 'Logged out' });
};

export const me = async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
};
