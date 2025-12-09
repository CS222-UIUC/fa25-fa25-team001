"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Reviews
export async function getMyReviews() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { reviews: [] } as const;

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      rating: true,
      createdAt: true,
      movie: { select: { title: true } },
    },
  });

  return {
    reviews: reviews.map(r => ({
      id: r.id,
      movieTitle: r.movie?.title || 'Untitled',
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
  if (!session?.user?.id) return { items: [] } as const;

  const list = await getOrCreateDefaultList(session.user.id);
  const items = await prisma.listItem.findMany({
    where: { listId: list.id },
    orderBy: { position: 'asc' },
    select: { id: true, position: true, movie: { select: { id: true, title: true, releaseYear: true } } },
  });

  return {
    items: items.map(i => ({ id: i.id, title: i.movie?.title || 'Untitled', year: i.movie?.releaseYear || null, position: i.position })),
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

  const item = await prisma.listItem.findUnique({ where: { id: itemId }, select: { id: true, listId: true } });
  if (!item) return { error: 'Not found' } as const;

  const list = await prisma.list.findUnique({ where: { id: item.listId }, select: { userId: true } });
  if (!list || list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  await prisma.listItem.delete({ where: { id: itemId } });
  return { success: true } as const;
}

// Trending Reviews
export async function getTrendingMovieReviews(limit: number = 5) {
  const reviews = await prisma.review.findMany({
    where: { movieId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      content: true,
      rating: true,
      createdAt: true,
      title: true,
      movie: { select: { title: true } },
      user: { select: { username: true } },
    },
  });

  return {
    reviews: reviews.map(r => ({
      id: r.id,
      mediaTitle: r.movie?.title || 'Untitled',
      rating: r.rating,
      content: r.content,
      title: r.title,
      username: r.user.username,
      date: r.createdAt.toISOString().split('T')[0],
    })),
  } as const;
}

export async function getTrendingGameReviews(limit: number = 5) {
  const reviews = await prisma.review.findMany({
    where: { videoGameId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      content: true,
      rating: true,
      createdAt: true,
      title: true,
      videoGame: { select: { title: true } },
      user: { select: { username: true } },
    },
  });

  return {
    reviews: reviews.map(r => ({
      id: r.id,
      mediaTitle: r.videoGame?.title || 'Untitled',
      rating: r.rating,
      content: r.content,
      title: r.title,
      username: r.user.username,
      date: r.createdAt.toISOString().split('T')[0],
    })),
  } as const;
}