"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function getMyReviews() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: { movie: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    reviews: reviews.map(r => ({
      id: r.id,
      movieTitle: r.movie?.title || 'Unknown',
      rating: r.rating,
      comment: r.content,
      date: r.createdAt.toISOString().split('T')[0],
    })),
  } as const;
}

export async function createReview(input: { movieTitle: string; rating: number; comment: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { movieTitle, rating, comment } = input;
  if (!movieTitle || !rating || !comment) return { error: 'movieTitle, rating, and comment are required' } as const;

  let movie = await prisma.movie.findFirst({ where: { title: movieTitle }, select: { id: true, title: true } });
  if (!movie) {
    movie = await prisma.movie.create({ data: { title: movieTitle }, select: { id: true, title: true } });
  }

  const review = await prisma.review.create({
    data: { userId: session.user.id, movieId: movie.id, content: comment, rating: Number(rating) },
    select: { id: true, createdAt: true },
  });

  return {
    review: {
      id: review.id,
      movieTitle: movie.title,
      rating: Number(rating),
      comment,
      date: review.createdAt.toISOString().split('T')[0],
    },
  } as const;
}

// Watchlist
async function getOrCreateDefaultList(userId: string) {
  let list = await prisma.list.findFirst({ where: { userId, title: 'Watchlist' }, select: { id: true } });
  if (!list) list = await prisma.list.create({ data: { userId, title: 'Watchlist', isPublic: false }, select: { id: true } });
  return list;
}

export async function getMyWatchlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await getOrCreateDefaultList(session.user.id);
  const items = await prisma.listItem.findMany({
    where: { listId: list.id },
    include: { movie: { select: { title: true, releaseYear: true } } },
    orderBy: { position: 'asc' },
  });

  return {
    items: items.filter(i => i.movie).map(i => ({
      id: i.id,
      title: i.movie!.title,
      year: i.movie!.releaseYear,
      position: i.position,
    })),
  } as const;
}

export async function addToWatchlist(input: { title: string; year?: number | null }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { title, year } = input;
  if (!title) return { error: 'title is required' } as const;

  const list = await getOrCreateDefaultList(session.user.id);
  let movie = await prisma.movie.findFirst({ where: { title }, select: { id: true, title: true, releaseYear: true } });
  if (!movie) movie = await prisma.movie.create({ data: { title, releaseYear: year ?? undefined }, select: { id: true, title: true, releaseYear: true } });
  const count = await prisma.listItem.count({ where: { listId: list.id } });
  const item = await prisma.listItem.create({ data: { listId: list.id, position: count + 1, movieId: movie.id }, select: { id: true, position: true } });

  return { item: { id: item.id, title: movie.title, year: movie.releaseYear || null, position: item.position } } as const;
}

export async function removeFromWatchlist(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  await prisma.listItem.deleteMany({ where: { id: itemId, list: { userId: session.user.id } } });
  return { success: true } as const;
}

export async function getMediaCounts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const userId = session.user.id;

  try {
    // Count movies (watched or dropped)
    const moviesCount = await prisma.movieWatched.count({
      where: {
        userId,
        status: {
          in: ['watched', 'dropped'],
        },
      },
    });

    // Count TV shows (watched, currently watching, or dropped)
    const tvShowsCount = await prisma.tvShowWatched.count({
      where: {
        userId,
        status: {
          in: ['watched', 'currently_watching', 'dropped'],
        },
      },
    });

    // Count games (playing, have_played, completed, dropped, or shelved)
    const gamesCount = await prisma.videoGamePlayed.count({
      where: {
        userId,
        status: {
          in: ['playing', 'have_played', 'completed', 'dropped', 'shelved'],
        },
      },
    });

    console.log('Media counts:', { userId, movies: moviesCount, tvShows: tvShowsCount, games: gamesCount });

    return {
      movies: moviesCount,
      tvShows: tvShowsCount,
      games: gamesCount,
    } as const;
  } catch (error: any) {
    // If status column doesn't exist yet, count all records
    if (error?.message?.includes('status') || error?.code === 'P2009') {
      const moviesCount = await prisma.movieWatched.count({
        where: { userId },
      });
      const tvShowsCount = await prisma.tvShowWatched.count({
        where: { userId },
      });
      const gamesCount = await prisma.videoGamePlayed.count({
        where: { userId },
      });

      return {
        movies: moviesCount,
        tvShows: tvShowsCount,
        games: gamesCount,
      } as const;
    }
    throw error;
  }
}

export async function getMyGames() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const userId = session.user.id;

  try {
    // Use raw query to get games even if the videoGame relationship is broken
    const gamesPlayed = await prisma.$queryRaw<Array<{
      id: string;
      gameId: string;
      status: string | null;
      playedAt: Date;
      gameTitle: string | null;
      gameYear: number | null;
    }>>`
      SELECT 
        vgp.id,
        vgp."gameId",
        vgp.status,
        vgp."playedAt",
        vg.title as "gameTitle",
        vg."releaseYear" as "gameYear"
      FROM video_games_played vgp
      LEFT JOIN video_games vg ON vgp."gameId" = vg.id
      WHERE vgp."userId" = ${userId}
        AND vgp.status IN ('playing', 'have_played', 'completed', 'dropped', 'shelved')
      ORDER BY vgp."playedAt" DESC
    `;

    return {
      games: gamesPlayed
        .filter((gp) => gp.status) // Only include games with a status
        .map((gp) => ({
          id: gp.gameId,
          title: gp.gameTitle || `Game ${gp.gameId}`,
          year: gp.gameYear,
          status: gp.status,
          playedAt: gp.playedAt,
        })),
    } as const;
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return { error: 'Failed to fetch games' } as const;
  }
}

export async function getMyMovies() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const userId = session.user.id;

  try {
    // Use raw query to get movies even if the movie relationship is broken
    const moviesWatched = await prisma.$queryRaw<Array<{
      id: string;
      movieId: string;
      status: string | null;
      watchedAt: Date;
      movieTitle: string | null;
      movieYear: number | null;
    }>>`
      SELECT 
        mw.id,
        mw."movieId",
        mw.status,
        mw."watchedAt",
        m.title as "movieTitle",
        m."releaseYear" as "movieYear"
      FROM movies_watched mw
      LEFT JOIN movies m ON mw."movieId" = m.id
      WHERE mw."userId" = ${userId}
        AND mw.status IN ('watched', 'dropped')
      ORDER BY mw."watchedAt" DESC
    `;

    return {
      movies: moviesWatched
        .filter((mw) => mw.status) // Only include movies with a status
        .map((mw) => ({
          id: mw.movieId,
          title: mw.movieTitle || `Movie ${mw.movieId}`,
          year: mw.movieYear,
          status: mw.status,
          watchedAt: mw.watchedAt,
        })),
    } as const;
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    return { error: 'Failed to fetch movies' } as const;
  }
}

export async function getMyTvShows() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const userId = session.user.id;

  try {
    // Use raw query to get TV shows even if the tvShow relationship is broken
    const tvShowsWatched = await prisma.$queryRaw<Array<{
      id: string;
      showId: string;
      status: string | null;
      watchedAt: Date;
      showTitle: string | null;
      showYear: number | null;
    }>>`
      SELECT 
        tsw.id,
        tsw."showId",
        tsw.status,
        tsw."watchedAt",
        ts.title as "showTitle",
        ts."releaseYear" as "showYear"
      FROM tv_shows_watched tsw
      LEFT JOIN tv_shows ts ON tsw."showId" = ts.id
      WHERE tsw."userId" = ${userId}
        AND tsw.status IN ('watched', 'currently_watching', 'dropped')
      ORDER BY tsw."watchedAt" DESC
    `;

    return {
      tvShows: tvShowsWatched
        .filter((tsw) => tsw.status) // Only include TV shows with a status
        .map((tsw) => ({
          id: tsw.showId,
          title: tsw.showTitle || `TV Show ${tsw.showId}`,
          year: tsw.showYear,
          status: tsw.status,
          watchedAt: tsw.watchedAt,
        })),
    } as const;
  } catch (error: any) {
    console.error('Error fetching TV shows:', error);
    return { error: 'Failed to fetch TV shows' } as const;
  }
}
