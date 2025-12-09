import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET user favorites
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        favoriteGames: true,
        favoriteMovies: true,
        favoriteTvShows: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      favoriteGames: user.favoriteGames || [],
      favoriteMovies: user.favoriteMovies || [],
      favoriteTvShows: user.favoriteTvShows || [],
    });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

// POST/PUT update user favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, items } = await request.json();

    if (!type || !['games', 'movies', 'tvshows'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be games, movies, or tvshows' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (type === 'games') updateData.favoriteGames = items;
    if (type === 'movies') updateData.favoriteMovies = items;
    if (type === 'tvshows') updateData.favoriteTvShows = items;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        favoriteGames: true,
        favoriteMovies: true,
        favoriteTvShows: true,
      },
    });

    return NextResponse.json({
      success: true,
      favoriteGames: updatedUser.favoriteGames || [],
      favoriteMovies: updatedUser.favoriteMovies || [],
      favoriteTvShows: updatedUser.favoriteTvShows || [],
    });
  } catch (error: any) {
    console.error('Update favorites error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update favorites' },
      { status: 500 }
    );
  }
}
