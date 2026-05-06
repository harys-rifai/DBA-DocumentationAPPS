import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const action = req.query.action as string;
  const module = req.query.module as string;

  const where: any = { flag: true };
  if (action) where.action = action;
  if (module) where.module = module;

  const [logs, total] = await Promise.all([
    prisma.logActivity.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.logActivity.count({ where }),
  ]);

  return res.json({
    status: 'success',
    data: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: logs,
    },
  });
};

export const getById = async (req: Request, res: Response) => {
  const log = await prisma.logActivity.findUnique({
    where: { id: BigInt(req.params.id) },
  });

  if (!log) {
    return res.status(404).json({ status: 'error', message: 'Log not found' });
  }

  return res.json({ status: 'success', data: log });
};
