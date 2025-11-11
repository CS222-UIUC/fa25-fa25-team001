"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * Rate a TV show
 * @param showTitle - The title of the TV show
 * @param rating - The rating (0.5 to 5.0 in 0.5 increments)
 */
export async function rateTvShow(showTitle: string, rating: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (!showTitle || !rating) {
    return { error: 'TV show title and rating are required' } as const;
  }

  if (rating < 0.5 || rating > 5.0 || (rating * 2) % 1 !== 0) {
    return { error: 'Rating must be between 0.5 and 5.0 in 0.5 increments' } as const;
  }

  try {
    // Find or create the TV show
    let show = await prisma.tvShow.findFirst({
      where: { title: showTitle },
      select: { id: true },
    });

    if (!show) {
      show = await prisma.tvShow.create({
        data: { title: showTitle },
        select: { id: true },
      });
    }

    // Upsert the rating (create or update)
    const showRating = await prisma.tvShowRating.upsert({
      where: {
        userId_showId: {
          userId: session.user.id,
          showId: show.id,
        },
      },
      create: {
        userId: session.user.id,
        showId: show.id,
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

    return { success: true, rating: showRating.rating } as const;
  } catch (error) {
    console.error('Error rating TV show:', error);
    return { error: 'Failed to rate TV show' } as const;
  }
}

/**
 * Get a user's rating for a TV show
 * @param showTitle - The title of the TV show
 */
export async function getUserTvShowRating(showTitle: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { rating: null } as const;

  try {
    const show = await prisma.tvShow.findFirst({
      where: { title: showTitle },
      select: { id: true },
    });

    if (!show) {
      return { rating: null } as const;
    }

    const rating = await prisma.tvShowRating.findUnique({
      where: {
        userId_showId: {
          userId: session.user.id,
          showId: show.id,
        },
      },
      select: {
        rating: true,
      },
    });

    return { rating: rating?.rating || null } as const;
  } catch (error) {
    console.error('Error getting TV show rating:', error);
    return { rating: null } as const;
  }
}

/**
 * Get user ratings for multiple TV shows
 * @param showTitles - Array of TV show titles
 */
export async function getUserTvShowRatings(showTitles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ratings: {} } as const;

  try {
    const shows = await prisma.tvShow.findMany({
      where: {
        title: { in: showTitles },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const showIds = shows.map((s) => s.id);
    const ratings = await prisma.tvShowRating.findMany({
      where: {
        userId: session.user.id,
        showId: { in: showIds },
      },
      select: {
        showId: true,
        rating: true,
        tvShow: {
          select: {
            title: true,
          },
        },
      },
    });

    const ratingsMap: Record<string, number> = {};
    ratings.forEach((r) => {
      if (r.tvShow?.title) {
        ratingsMap[r.tvShow.title] = r.rating;
      }
    });

    return { ratings: ratingsMap } as const;
  } catch (error) {
    console.error('Error getting TV show ratings:', error);
    return { ratings: {} } as const;
  }
}
