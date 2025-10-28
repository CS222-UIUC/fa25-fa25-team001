import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

async function getOrCreateDefaultList(userId: string) {
  let list = await prisma.list.findFirst({ where: { userId, title: 'Watchlist' }, select: { id: true } });
  if (!list) {
    list = await prisma.list.create({ data: { userId, title: 'Watchlist', isPublic: false }, select: { id: true } });
  }
  return list;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ items: [] }, { status: 200 });

    const list = await getOrCreateDefaultList(session.user.id);

    const items = await prisma.listItem.findMany({
      where: { listId: list.id },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        position: true,
        movie: { select: { id: true, title: true, releaseYear: true } },
      }
    });

    return NextResponse.json({ items: items.map(i => ({
      id: i.id,
      title: i.movie?.title || 'Untitled',
      year: i.movie?.releaseYear || null,
      position: i.position,
    })) });
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, year } = await request.json();
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const list = await getOrCreateDefaultList(session.user.id);

    // Find or create movie
    let movie = await prisma.movie.findFirst({ where: { title }, select: { id: true, title: true, releaseYear: true } });
    if (!movie) {
      movie = await prisma.movie.create({ data: { title, releaseYear: year ?? undefined }, select: { id: true, title: true, releaseYear: true } });
    }

    // Determine next position
    const count = await prisma.listItem.count({ where: { listId: list.id } });

    const item = await prisma.listItem.create({
      data: {
        listId: list.id,
        position: count + 1,
        movieId: movie.id,
      },
      select: { id: true, position: true }
    });

    return NextResponse.json({
      item: {
        id: item.id,
        title: movie.title,
        year: movie.releaseYear || null,
        position: item.position,
      }
    }, { status: 201 });
  } catch (e) {
    console.error('Add to watchlist error', e);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 });

    const item = await prisma.listItem.findUnique({ where: { id: itemId }, select: { id: true, listId: true } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ensure item belongs to user's default list
    const list = await prisma.list.findUnique({ where: { id: item.listId }, select: { userId: true } });
    if (!list || list.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.listItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Remove from watchlist error', e);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}