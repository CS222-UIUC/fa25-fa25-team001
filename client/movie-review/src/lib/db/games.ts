import prisma from '@/lib/prisma';

export const gameQueries = {
  findByTitle: (title: string) =>
    prisma.videoGame.findMany({
      where: { title: { contains: title, mode: 'insensitive' } },
      select: { id: true, title: true, releaseYear: true, genre: true },
      take: 5,
    }),

  create: (data: { title: string; releaseYear?: number; genre?: string; developer?: string; platform?: string }) =>
    prisma.videoGame.create({ data }),
};