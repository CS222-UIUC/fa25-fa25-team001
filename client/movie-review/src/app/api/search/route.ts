import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ movies: [], users: [] });
    }

    // Query users and movies by substring match, limit results
    const [users, movies] = await Promise.all([
      prisma.user.findMany({
        where: {
          username: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, username: true, profilePicture: true },
        take: 10,
      }),
      prisma.movie.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, title: true, releaseYear: true },
        take: 10,
      })
    ]);

    return NextResponse.json({
      users: users.map(u => ({ id: u.id, username: u.username, profilePicture: u.profilePicture })),
      movies: movies.map(m => ({ id: m.id, title: m.title, year: m.releaseYear })),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ movies: [], users: [] });
  }
}