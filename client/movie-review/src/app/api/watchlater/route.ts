import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's lists that represent "Watch Later"
    const watchLaterList = await prisma.list.findFirst({
      where: {
        userId: user.id,
        title: "Watch Later"
      },
      include: {
        items: {
          include: {
            movie: true,
            tvShow: true,
            videoGame: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!watchLaterList) {
      return NextResponse.json([]);
    }

    // Transform list items to match our frontend interface
    const watchLaterItems = watchLaterList.items.map(item => ({
      id: item.id,
      title: item.movie?.title || item.tvShow?.title || item.videoGame?.title || 'Unknown',
      mediaType: item.movie ? 'movie' : item.tvShow ? 'tvshow' : 'game',
      year: item.movie?.releaseYear?.toString() || item.tvShow?.releaseYear?.toString() || item.videoGame?.releaseYear?.toString(),
      poster: item.movie?.poster || item.tvShow?.poster || item.videoGame?.cover || null,
      source: 'Database',
      externalId: item.movie?.id || item.tvShow?.id || item.videoGame?.id || '',
      addedAt: item.createdAt,
      priority: item.notes?.includes('high') ? 'high' : 
               item.notes?.includes('medium') ? 'medium' : 'low',
      notes: item.notes || undefined
    }));

    return NextResponse.json(watchLaterItems);
  } catch (error) {
    console.error("Watch Later fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch later items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mediaId, mediaType, title, year, poster, source, priority = 'medium', notes } = await request.json();

    if (!mediaId || !mediaType || !title) {
      return NextResponse.json(
        { error: "Missing required fields: mediaId, mediaType, title" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find or create the "Watch Later" list
    let watchLaterList = await prisma.list.findFirst({
      where: {
        userId: user.id,
        title: "Watch Later"
      }
    });

    if (!watchLaterList) {
      watchLaterList = await prisma.list.create({
        data: {
          title: "Watch Later",
          description: "Movies, TV shows, and games to watch/play later",
          userId: user.id,
          isPublic: false
        }
      });
    }

    // Ensure the media exists in our database
    let movieId = null, tvShowId = null, gameId = null;

    if (mediaType === 'movie') {
      // Check if movie already exists by title first
      let movie = await prisma.movie.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      if (!movie) {
        movie = await prisma.movie.create({
          data: {
            id: mediaId, // Use OMDB ID as database ID
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            poster: poster && poster !== 'N/A' ? poster : null
          }
        });
      }
      movieId = movie.id;
    } else if (mediaType === 'tvshow') {
      // Check if TV show already exists by title first
      let tvShow = await prisma.tvShow.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      if (!tvShow) {
        tvShow = await prisma.tvShow.create({
          data: {
            id: mediaId, // Use OMDB ID as database ID
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            poster: poster && poster !== 'N/A' ? poster : null
          }
        });
      }
      tvShowId = tvShow.id;
    } else if (mediaType === 'game') {
      // Check if game already exists by title first
      let game = await prisma.videoGame.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      if (!game) {
        game = await prisma.videoGame.create({
          data: {
            id: mediaId, // Use RAWG ID as database ID
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            cover: poster || null
          }
        });
      }
      gameId = game.id;
    }

    // Get the next position
    const lastItem = await prisma.listItem.findFirst({
      where: { listId: watchLaterList.id },
      orderBy: { position: 'desc' }
    });
    const nextPosition = (lastItem?.position || 0) + 1;

    // Create the list item
    const listItem = await prisma.listItem.create({
      data: {
        listId: watchLaterList.id,
        position: nextPosition,
        movieId,
        tvShowId,
        videoGameId: gameId,
        notes: `${priority}${notes ? ` | ${notes}` : ''}`
      },
      include: {
        movie: true,
        tvShow: true,
        videoGame: true
      }
    });

    // Transform to match frontend interface
    const watchLaterItem = {
      id: listItem.id,
      title: listItem.movie?.title || listItem.tvShow?.title || listItem.videoGame?.title || title,
      mediaType,
      year,
      poster,
      source: source || 'Database',
      externalId: mediaId,
      addedAt: listItem.createdAt,
      priority,
      notes
    };

    return NextResponse.json(watchLaterItem, { status: 201 });
  } catch (error) {
    console.error("Watch Later add error:", error);
    return NextResponse.json(
      { error: "Failed to add to watch later" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the list item (only if it belongs to the user)
    await prisma.listItem.deleteMany({
      where: {
        id: id,
        list: {
          userId: user.id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Watch Later delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove from watch later" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, priority } = await request.json();

    if (!id || !priority) {
      return NextResponse.json(
        { error: "Missing required fields: id, priority" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update the list item priority
    await prisma.listItem.updateMany({
      where: {
        id: id,
        list: {
          userId: user.id
        }
      },
      data: {
        notes: priority
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Watch Later update error:", error);
    return NextResponse.json(
      { error: "Failed to update watch later item" },
      { status: 500 }
    );
  }
}