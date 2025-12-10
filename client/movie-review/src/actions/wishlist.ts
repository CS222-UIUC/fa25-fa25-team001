"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Game Wishlist
export async function addGameToWishlist(input: { gameId: string; gameName: string; gameCover?: string; gameYear?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { gameId, gameName, gameCover, gameYear } = input;
  if (!gameId || !gameName) return { error: 'gameId and gameName are required' } as const;

  try {
    const wishlistItem = await prisma.gameWishlist.create({
      data: {
        userId: session.user.id,
        gameId,
        gameName,
        gameCover: gameCover || null,
        gameYear: gameYear || null,
      },
      select: { id: true, gameId: true, gameName: true, gameCover: true, gameYear: true },
    });

    return { success: true, item: wishlistItem } as const;
  } catch (error: any) {
    // If unique constraint violation, item already exists
    if (error.code === 'P2002') {
      return { error: 'Game already in wishlist' } as const;
    }
    console.error('Error adding game to wishlist:', error);
    return { error: 'Failed to add game to wishlist' } as const;
  }
}

export async function removeGameFromWishlist(gameId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    await prisma.gameWishlist.deleteMany({
      where: { userId: session.user.id, gameId },
    });
    return { success: true } as const;
  } catch (error) {
    console.error('Error removing game from wishlist:', error);
    return { error: 'Failed to remove game from wishlist' } as const;
  }
}

export async function getMyGameWishlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { items: [] } as const;

  const items = await prisma.gameWishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, gameId: true, gameName: true, gameCover: true, gameYear: true },
  });

  return { items } as const;
}

export async function isGameInWishlist(gameId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const item = await prisma.gameWishlist.findFirst({
    where: { userId: session.user.id, gameId },
  });

  return !!item;
}

// Movie Wishlist
export async function addMovieToWishlist(input: { movieId: string; movieName: string; moviePoster?: string; movieYear?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { movieId, movieName, moviePoster, movieYear } = input;
  if (!movieId || !movieName) return { error: 'movieId and movieName are required' } as const;

  try {
    const wishlistItem = await prisma.movieWishlist.create({
      data: {
        userId: session.user.id,
        movieId,
        movieName,
        moviePoster: moviePoster || null,
        movieYear: movieYear || null,
      },
      select: { id: true, movieId: true, movieName: true, moviePoster: true, movieYear: true },
    });

    return { success: true, item: wishlistItem } as const;
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Movie already in wishlist' } as const;
    }
    console.error('Error adding movie to wishlist:', error);
    return { error: 'Failed to add movie to wishlist' } as const;
  }
}

export async function removeMovieFromWishlist(movieId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    await prisma.movieWishlist.deleteMany({
      where: { userId: session.user.id, movieId },
    });
    return { success: true } as const;
  } catch (error) {
    console.error('Error removing movie from wishlist:', error);
    return { error: 'Failed to remove movie from wishlist' } as const;
  }
}

export async function getMyMovieWishlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { items: [] } as const;

  const items = await prisma.movieWishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, movieId: true, movieName: true, moviePoster: true, movieYear: true },
  });

  return { items } as const;
}

export async function isMovieInWishlist(movieId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const item = await prisma.movieWishlist.findFirst({
    where: { userId: session.user.id, movieId },
  });

  return !!item;
}

// TV Show Wishlist
export async function addTvShowToWishlist(input: { showId: string; showName: string; showPoster?: string; showYear?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { showId, showName, showPoster, showYear } = input;
  if (!showId || !showName) return { error: 'showId and showName are required' } as const;

  try {
    const wishlistItem = await prisma.tvShowWishlist.create({
      data: {
        userId: session.user.id,
        showId,
        showName,
        showPoster: showPoster || null,
        showYear: showYear || null,
      },
      select: { id: true, showId: true, showName: true, showPoster: true, showYear: true },
    });

    return { success: true, item: wishlistItem } as const;
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'TV show already in wishlist' } as const;
    }
    console.error('Error adding TV show to wishlist:', error);
    return { error: 'Failed to add TV show to wishlist' } as const;
  }
}

export async function removeTvShowFromWishlist(showId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    await prisma.tvShowWishlist.deleteMany({
      where: { userId: session.user.id, showId },
    });
    return { success: true } as const;
  } catch (error) {
    console.error('Error removing TV show from wishlist:', error);
    return { error: 'Failed to remove TV show from wishlist' } as const;
  }
}

export async function getMyTvShowWishlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { items: [] } as const;

  const items = await prisma.tvShowWishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, showId: true, showName: true, showPoster: true, showYear: true },
  });

  return { items } as const;
}

export async function isTvShowInWishlist(showId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const item = await prisma.tvShowWishlist.findFirst({
    where: { userId: session.user.id, showId },
  });

  return !!item;
}


