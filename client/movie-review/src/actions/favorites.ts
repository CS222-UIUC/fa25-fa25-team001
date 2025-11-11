"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface FavoriteGame {
  id: string;
  title: string;
  posterUrl?: string;
  platform?: string;
  igdbId?: number;
}

interface FavoriteMovie {
  id: string;
  title: string;
  posterUrl?: string;
  year?: number;
  tmdbId?: string;
}

interface FavoriteTvShow {
  id: string;
  title: string;
  posterUrl?: string;
  year?: number;
  tmdbId?: string;
}

export async function getFavorites() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      favoriteGames: true,
      favoriteMovies: true,
      favoriteTvShows: true,
    },
  });

  if (!user) return { error: 'User not found' } as const;

  return {
    success: true,
    favorites: {
      games: (user.favoriteGames as FavoriteGame[] | null) || [],
      movies: (user.favoriteMovies as FavoriteMovie[] | null) || [],
      tvShows: (user.favoriteTvShows as FavoriteTvShow[] | null) || [],
    },
  } as const;
}

export async function updateFavoriteGames(games: FavoriteGame[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (games.length > 5) {
    return { error: 'Maximum 5 favorite games allowed' } as const;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteGames: games },
  });

  return { success: true } as const;
}

export async function updateFavoriteMovies(movies: FavoriteMovie[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (movies.length > 5) {
    return { error: 'Maximum 5 favorite movies allowed' } as const;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteMovies: movies },
  });

  return { success: true } as const;
}

export async function updateFavoriteTvShows(tvShows: FavoriteTvShow[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (tvShows.length > 5) {
    return { error: 'Maximum 5 favorite TV shows allowed' } as const;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteTvShows: tvShows },
  });

  return { success: true } as const;
}
