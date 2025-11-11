import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!q || q.trim().length < 1) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: q.trim(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        bio: true,
      },
      take: limit
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query.trim(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        profilePicture: true
      },
      take: 5
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json([]);
  }
}