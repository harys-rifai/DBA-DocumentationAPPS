import { PrismaClient, DbType } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const dbType = req.query.db_type as string;
  const search = req.query.search as string;
  const sort = (req.query.sort as string) || 'rank';
  const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';

  const where: any = { flag: true };
  if (dbType) where.dbType = dbType as DbType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  orderBy[sort] = order;

  const [docs, total] = await Promise.all([
    prisma.dokumentasiDB.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    }),
    prisma.dokumentasiDB.count({ where }),
  ]);

  return res.json({
    status: 'success',
    data: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sort,
      order,
      data: docs,
    },
  });
};

export const getById = async (req: Request, res: Response) => {
  const doc = await prisma.dokumentasiDB.findFirst({
    where: { id: parseInt(req.params.id), flag: true },
  });

  if (!doc) {
    return res.status(404).json({ status: 'error', message: 'Dokumentasi not found' });
  }

  return res.json({ status: 'success', data: doc });
};

export const create = async (req: Request, res: Response) => {
  const { dbType, title, tutorial, summary, rank, tags, version, autoUpdate } = req.body;

  if (!dbType || !title) {
    return res.status(400).json({ status: 'error', message: 'dbType and title are required' });
  }

  const doc = await prisma.dokumentasiDB.create({
    data: {
      dbType: dbType as DbType,
      title,
      tutorial,
      summary,
      rank: rank || 0,
      tags: tags || [],
      version,
      autoUpdate: autoUpdate ?? true,
      authorId: (req as any).user?.id,
    },
  });

  return res.status(201).json({ status: 'success', message: 'Dokumentasi created', data: doc });
};

export const update = async (req: Request, res: Response) => {
  const { dbType, title, tutorial, summary, rank, tags, version, autoUpdate } = req.body;

  const doc = await prisma.dokumentasiDB.update({
    where: { id: parseInt(req.params.id) },
    data: {
      dbType: dbType as DbType,
      title,
      tutorial,
      summary,
      rank,
      tags,
      version,
      autoUpdate,
    },
  });

  return res.json({ status: 'success', message: 'Dokumentasi updated', data: doc });
};

export const remove = async (req: Request, res: Response) => {
  await prisma.dokumentasiDB.update({
    where: { id: parseInt(req.params.id) },
    data: { flag: false },
  });

  return res.json({ status: 'success', message: 'Dokumentasi deleted' });
};

export const getDbTypes = async (req: Request, res: Response) => {
  const dbTypes = [
    { type: 'mysql', name: 'MySQL', currentVersion: '8.0.36' },
    { type: 'postgresql', name: 'PostgreSQL', currentVersion: '16.2' },
    { type: 'redis', name: 'Redis', currentVersion: '7.2.4' },
    { type: 'mongodb', name: 'MongoDB', currentVersion: '7.0.6' },
    { type: 'oracle', name: 'Oracle Database', currentVersion: '21c' },
    { type: 'sqlserver', name: 'MS SQL Server', currentVersion: '2022' },
    { type: 'edb', name: 'EnterpriseDB (EDB)', currentVersion: '16.2' },
    { type: 'db2', name: 'IBM DB2', currentVersion: '11.5' },
  ];

  return res.json({ status: 'success', message: 'Database types fetched', data: dbTypes });
};
