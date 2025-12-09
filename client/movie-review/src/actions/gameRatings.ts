"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * Rate a video game
 * @param gameTitle - The title of the game
 * @param rating - The rating (0.5 to 5.0 in 0.5 increments)
 * @param igdbId - Optional IGDB ID for the game
 */
export async function rateGame(gameTitle: string, rating: number, igdbId?: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (!gameTitle || !rating) {
    return { error: 'Game title and rating are required' } as const;
  }

  if (rating < 0.5 || rating > 5.0 || (rating * 2) % 1 !== 0) {
    return { error: 'Rating must be between 0.5 and 5.0 in 0.5 increments' } as const;
  }

  try {
    // Find or create the video game
    let game = await prisma.videoGame.findFirst({
      where: { title: gameTitle },
      select: { id: true },
    });

    if (!game) {
      game = await prisma.videoGame.create({
        data: { title: gameTitle },
        select: { id: true },
      });
    }

    // Upsert the rating (create or update)
    const gameRating = await prisma.videoGameRating.upsert({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: game.id,
        },
      },
      create: {
        userId: session.user.id,
        gameId: game.id,
        rating: rating,
      },
      update: {
        rating: rating,
      },
      select: {
        id: true,
        rating: true,
      },
    });

    return { success: true, rating: gameRating.rating } as const;
  } catch (error) {
    console.error('Error rating game:', error);
    return { error: 'Failed to rate game' } as const;
  }
}

/**
 * Get a user's rating for a game
 * @param gameTitle - The title of the game
 */
export async function getUserGameRating(gameTitle: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { rating: null } as const;

  try {
    const game = await prisma.videoGame.findFirst({
      where: { title: gameTitle },
      select: { id: true },
    });

    if (!game) {
      return { rating: null } as const;
    }

    const rating = await prisma.videoGameRating.findUnique({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: game.id,
        },
      },
      select: {
        rating: true,
      },
    });

    return { rating: rating?.rating || null } as const;
  } catch (error) {
    console.error('Error getting game rating:', error);
    return { rating: null } as const;
  }
}

/**
 * Get user ratings for multiple games
 * @param gameTitles - Array of game titles
 */
export async function getUserGameRatings(gameTitles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ratings: {} } as const;

  try {
    const games = await prisma.videoGame.findMany({
      where: {
        title: { in: gameTitles },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const gameIds = games.map((g) => g.id);
    const ratings = await prisma.videoGameRating.findMany({
      where: {
        userId: session.user.id,
        gameId: { in: gameIds },
      },
      select: {
        gameId: true,
        rating: true,
        videoGame: {
          select: {
            title: true,
          },
        },
      },
    });

    const ratingsMap: Record<string, number> = {};
    ratings.forEach((r) => {
      if (r.videoGame?.title) {
        ratingsMap[r.videoGame.title] = r.rating;
      }
    });

    return { ratings: ratingsMap } as const;
  } catch (error) {
    console.error('Error getting game ratings:', error);
    return { ratings: {} } as const;
  }
}
