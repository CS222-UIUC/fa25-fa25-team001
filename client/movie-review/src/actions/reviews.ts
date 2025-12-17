"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Get all reviews (for reviews page)
export async function getAllReviews() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        videoGame: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        tvShow: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      reviews: reviews.map((r) => {
        const mediaType = r.movieId ? 'movie' : r.videoGameId ? 'game' : r.tvShowId ? 'tv' : null;
        const media = r.movie || r.videoGame || r.tvShow;

        return {
          id: r.id,
          title: r.title,
          content: r.content,
          rating: r.rating,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          user: {
            id: r.user.id,
            username: r.user.username,
            profilePicture: r.user.profilePicture,
          },
          mediaType,
          media: media ? {
            id: media.id,
            title: media.title,
            year: 'releaseYear' in media ? media.releaseYear : null,
            // posterUrl will be fetched on client side
            posterUrl: null,
          } : null,
          likesCount: r.likes.length,
          isLiked: r.likes.some((like) => like.userId === session.user.id),
          comments: r.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            user: {
              id: c.user.id,
              username: c.user.username,
              profilePicture: c.user.profilePicture,
            },
          })),
        };
      }),
    } as const;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { error: 'Failed to fetch reviews' } as const;
  }
}

// Get user's own reviews
export async function getMyReviews() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        videoGame: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        tvShow: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      reviews: reviews.map((r) => {
        const mediaType = r.movieId ? 'movie' : r.videoGameId ? 'game' : r.tvShowId ? 'tv' : null;
        const media = r.movie || r.videoGame || r.tvShow;

        return {
          id: r.id,
          title: r.title,
          content: r.content,
          rating: r.rating,
          createdAt: r.createdAt,
          mediaType,
          media: media ? {
            id: media.id,
            title: media.title,
            year: 'releaseYear' in media ? media.releaseYear : null,
          } : null,
        };
      }),
    } as const;
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    return { error: 'Failed to fetch reviews' } as const;
  }
}

// Create a review
export async function createReview(input: {
  mediaType: 'movie' | 'game' | 'tv';
  mediaId: string;
  mediaTitle: string;
  rating: number;
  title?: string;
  content: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { mediaType, mediaId, mediaTitle, rating, title, content } = input;

  if (!mediaType || !mediaId || !mediaTitle || !rating || !content) {
    return { error: 'All fields are required' } as const;
  }

  if (rating < 0.5 || rating > 5.0) {
    return { error: 'Rating must be between 0.5 and 5.0' } as const;
  }

  try {
    // Find or create the media record
    let movieId: string | null = null;
    let videoGameId: string | null = null;
    let tvShowId: string | null = null;

    if (mediaType === 'movie') {
      let movie = await prisma.movie.findFirst({
        where: { id: mediaId },
        select: { id: true },
      });
      if (!movie) {
        movie = await prisma.movie.create({
          data: { id: mediaId, title: mediaTitle },
          select: { id: true },
        });
      }
      movieId = movie.id;
    } else if (mediaType === 'game') {
      let game = await prisma.videoGame.findFirst({
        where: { id: mediaId },
        select: { id: true },
      });
      if (!game) {
        game = await prisma.videoGame.create({
          data: { id: mediaId, title: mediaTitle },
          select: { id: true },
        });
      }
      videoGameId = game.id;
    } else if (mediaType === 'tv') {
      let tvShow = await prisma.tvShow.findFirst({
        where: { id: mediaId },
        select: { id: true },
      });
      if (!tvShow) {
        tvShow = await prisma.tvShow.create({
          data: { id: mediaId, title: mediaTitle },
          select: { id: true },
        });
      }
      tvShowId = tvShow.id;
    }

    // Check if user already reviewed this media
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        ...(movieId ? { movieId } : {}),
        ...(videoGameId ? { videoGameId } : {}),
        ...(tvShowId ? { tvShowId } : {}),
      },
    });

    if (existingReview) {
      // Update existing review
      const review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          title,
          content,
          rating: Number(rating),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          movie: {
            select: {
              id: true,
              title: true,
              releaseYear: true,
            },
          },
          videoGame: {
            select: {
              id: true,
              title: true,
              releaseYear: true,
            },
          },
          tvShow: {
            select: {
              id: true,
              title: true,
              releaseYear: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      const media = review.movie || review.videoGame || review.tvShow;

      return {
        review: {
          id: review.id,
          title: review.title,
          content: review.content,
          rating: review.rating,
          createdAt: review.createdAt,
          user: {
            id: review.user.id,
            username: review.user.username,
            profilePicture: review.user.profilePicture,
          },
          mediaType,
          media: media ? {
            id: media.id,
            title: media.title,
            year: 'releaseYear' in media ? media.releaseYear : null,
          } : null,
          likesCount: review.likes.length,
          isLiked: review.likes.some((like) => like.userId === session.user.id),
          comments: review.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            user: {
              id: c.user.id,
              username: c.user.username,
              profilePicture: c.user.profilePicture,
            },
          })),
        },
      } as const;
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        movieId,
        videoGameId,
        tvShowId,
        title,
        content,
        rating: Number(rating),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        videoGame: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        tvShow: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const media = review.movie || review.videoGame || review.tvShow;

    return {
      review: {
        id: review.id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          username: review.user.username,
          profilePicture: review.user.profilePicture,
        },
        mediaType,
        media: media ? {
          id: media.id,
          title: media.title,
          year: 'releaseYear' in media ? media.releaseYear : null,
        } : null,
        likesCount: review.likes.length,
        isLiked: review.likes.some((like) => like.userId === session.user.id),
        comments: review.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: {
            id: c.user.id,
            username: c.user.username,
            profilePicture: c.user.profilePicture,
          },
        })),
      },
    } as const;
  } catch (error) {
    console.error('Error creating review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to create review: ${errorMessage}` } as const;
  }
}

// Like a review
export async function likeReview(reviewId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    // Check if already liked
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        userId_reviewId: {
          userId: session.user.id,
          reviewId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.reviewLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      const likesCount = await prisma.reviewLike.count({
        where: { reviewId },
      });

      return { success: true, liked: false, likesCount } as const;
    }

    // Like
    await prisma.reviewLike.create({
      data: {
        userId: session.user.id,
        reviewId,
      },
    });

    const likesCount = await prisma.reviewLike.count({
      where: { reviewId },
    });

    return { success: true, liked: true, likesCount } as const;
  } catch (error) {
    console.error('Error liking review:', error);
    return { error: 'Failed to like review' } as const;
  }
}

// Add a comment to a review
export async function addComment(reviewId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (!content || !content.trim()) {
    return { error: 'Comment content is required' } as const;
  }

  try {
    const comment = await prisma.reviewComment.create({
      data: {
        userId: session.user.id,
        reviewId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          profilePicture: comment.user.profilePicture,
        },
      },
    } as const;
  } catch (error) {
    console.error('Error adding comment:', error);
    return { error: 'Failed to add comment' } as const;
  }
}

