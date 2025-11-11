"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * Rate a movie
 * @param movieTitle - The title of the movie
 * @param rating - The rating (0.5 to 5.0 in 0.5 increments)
 */
export async function rateMovie(movieTitle: string, rating: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (!movieTitle || !rating) {
    return { error: 'Movie title and rating are required' } as const;
  }

  if (rating < 0.5 || rating > 5.0 || (rating * 2) % 1 !== 0) {
    return { error: 'Rating must be between 0.5 and 5.0 in 0.5 increments' } as const;
  }

  try {
    // Find or create the movie
    let movie = await prisma.movie.findFirst({
      where: { title: movieTitle },
      select: { id: true },
    });

    if (!movie) {
      movie = await prisma.movie.create({
        data: { title: movieTitle },
        select: { id: true },
      });
    }

    // Upsert the rating (create or update)
    const movieRating = await prisma.movieRating.upsert({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movie.id,
        },
      },
      create: {
        userId: session.user.id,
        movieId: movie.id,
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

    return { success: true, rating: movieRating.rating } as const;
  } catch (error) {
    console.error('Error rating movie:', error);
    return { error: 'Failed to rate movie' } as const;
  }
}

/**
 * Get a user's rating for a movie
 * @param movieTitle - The title of the movie
 */
export async function getUserMovieRating(movieTitle: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { rating: null } as const;

  try {
    const movie = await prisma.movie.findFirst({
      where: { title: movieTitle },
      select: { id: true },
    });

    if (!movie) {
      return { rating: null } as const;
    }

    const rating = await prisma.movieRating.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movie.id,
        },
      },
      select: {
        rating: true,
      },
    });

    return { rating: rating?.rating || null } as const;
  } catch (error) {
    console.error('Error getting movie rating:', error);
    return { rating: null } as const;
  }
}

/**
 * Get user ratings for multiple movies
 * @param movieTitles - Array of movie titles
 */
export async function getUserMovieRatings(movieTitles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ratings: {} } as const;

  try {
    const movies = await prisma.movie.findMany({
      where: {
        title: { in: movieTitles },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const movieIds = movies.map((m) => m.id);
    const ratings = await prisma.movieRating.findMany({
      where: {
        userId: session.user.id,
        movieId: { in: movieIds },
      },
      select: {
        movieId: true,
        rating: true,
        movie: {
          select: {
            title: true,
          },
        },
      },
    });

    const ratingsMap: Record<string, number> = {};
    ratings.forEach((r) => {
      if (r.movie?.title) {
        ratingsMap[r.movie.title] = r.rating;
      }
    });

    return { ratings: ratingsMap } as const;
  } catch (error) {
    console.error('Error getting movie ratings:', error);
    return { ratings: {} } as const;
  }
}
