"use server";

import prisma from '@/lib/prisma';

export async function searchEverything(q: string) {
  const query = (q || '').trim();
  if (!query || query.length < 2) return { users: [], movies: [] } as const;

  const [users, movies] = await Promise.all([
    prisma.user.findMany({
      where: { username: { contains: query, mode: 'insensitive' } },
      select: { id: true, username: true, profilePicture: true },
      take: 10,
    }),
    prisma.movie.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      select: { id: true, title: true, releaseYear: true },
      take: 10,
    }),
  ]);

  return {
    users: users.map(u => ({ id: u.id, username: u.username, profilePicture: u.profilePicture })),
    movies: movies.map(m => ({ id: m.id, title: m.title, year: m.releaseYear })),
  } as const;
}
