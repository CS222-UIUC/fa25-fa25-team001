import prisma from '@/lib/prisma';

export const movieQueries = {
  findByTitle: (title: string) =>
    prisma.movie.findMany({
      where: { title: { contains: title, mode: 'insensitive' } },
      select: { id: true, title: true, releaseYear: true, genre: true },
      take: 5,
    }),

  create: (data: { title: string; releaseYear?: number; genre?: string; director?: string }) =>
    prisma.movie.create({ data }),
};