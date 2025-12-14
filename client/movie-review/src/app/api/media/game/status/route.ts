import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const title = searchParams.get('title');

    if (!mediaId && !title) {
      return NextResponse.json({ error: 'Missing mediaId or title' }, { status: 400 });
    }

    // Try to find game by ID first
    let game = null;
    if (mediaId) {
      game = await prisma.videoGame.findFirst({ where: { id: String(mediaId) } });
    }

    // If not found by ID, try by title
    if (!game && title) {
      game = await prisma.videoGame.findFirst({ where: { title: title } });
    }

    if (!game) {
      return NextResponse.json({ status: null });
    }

    // Find status by gameId (not mediaId, since game might have been found by title)
    const played = await prisma.$queryRaw<Array<{ status: string | null }>>`
      SELECT status
      FROM video_games_played
      WHERE "userId" = ${session.user.id} AND "gameId" = ${game.id}
      LIMIT 1
    `;

    return NextResponse.json({ status: played[0]?.status || null });
  } catch (error) {
    console.error('Error fetching game status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId, status, title } = await request.json();

    if (!mediaId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['playing', 'have_played', 'completed', 'dropped', 'shelved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find or create game
    // mediaId from IGDB is numeric, but our DB uses string IDs
    let game = await prisma.videoGame.findFirst({
      where: { 
        id: String(mediaId)
      },
    });

    // If game doesn't exist, try to find by title
    if (!game && title) {
      game = await prisma.videoGame.findFirst({
        where: { 
          title: title
        },
      });
    }

    // If game found by title but has different ID, check if user has status for the old game
    // and migrate it to the new game ID
    if (game && game.id !== String(mediaId) && title) {
      const oldGameStatus = await prisma.$queryRaw<Array<{ status: string | null }>>`
        SELECT status
        FROM video_games_played
        WHERE "userId" = ${session.user.id} AND "gameId" = ${String(mediaId)}
        LIMIT 1
      `;
      
      // If status exists for old ID, we'll update it to use the found game's ID
      if (oldGameStatus.length > 0 && oldGameStatus[0].status) {
        // Delete old record
        await prisma.$executeRawUnsafe(
          `DELETE FROM video_games_played WHERE "userId" = $1 AND "gameId" = $2`,
          session.user.id,
          String(mediaId)
        );
        console.log('Migrated game status from old ID to new ID:', { oldId: mediaId, newId: game.id });
      }
    }

    // If game still doesn't exist, create it
    if (!game) {
      if (!title) {
        return NextResponse.json({ error: 'Game title is required to create a new game' }, { status: 400 });
      }
      
      try {
        game = await prisma.videoGame.create({
          data: {
            id: String(mediaId),
            title: title,
          },
        });
        console.log('Created new game:', { id: game.id, title: game.title });
      } catch (createError: any) {
        // If creation fails (e.g., ID already exists), try to find it again
        if (createError?.code === 'P2002') {
          game = await prisma.videoGame.findUnique({
            where: { id: String(mediaId) },
          });
        }
        if (!game) {
          console.error('Failed to create game:', createError);
          return NextResponse.json({ 
            error: 'Failed to create game',
            details: createError?.message 
          }, { status: 500 });
        }
      }
    }

    // Upsert the played status
    // Use updateMany/create pattern to work around Prisma client type issues
    const existing = await prisma.videoGamePlayed.findUnique({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: game.id,
        },
      },
    });

    let result;
    if (existing) {
      // Update existing record - using $executeRawUnsafe to bypass type checking
      await prisma.$executeRawUnsafe(
        `UPDATE video_games_played SET status = $1, "playedAt" = $2 WHERE "userId" = $3 AND "gameId" = $4`,
        status,
        new Date(),
        session.user.id,
        game.id
      );
      result = await prisma.videoGamePlayed.findUnique({
        where: {
          userId_gameId: {
            userId: session.user.id,
            gameId: game.id,
          },
        },
      });
    } else {
      // Create new record using raw SQL
      const newId = `vgp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO video_games_played (id, "userId", "gameId", status, "playedAt") VALUES ($1, $2, $3, $4, $5)`,
        newId,
        session.user.id,
        game.id,
        status,
        new Date()
      );
      result = await prisma.videoGamePlayed.findUnique({
        where: {
          userId_gameId: {
            userId: session.user.id,
            gameId: game.id,
          },
        },
      });
    }

    console.log('Game status updated:', { userId: session.user.id, gameId: game.id, status, resultId: result?.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating game status:', error);
    const errorMessage = error?.message || 'Internal server error';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    }

    await prisma.videoGamePlayed.deleteMany({
      where: {
        userId: session.user.id,
        gameId: mediaId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing game status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

