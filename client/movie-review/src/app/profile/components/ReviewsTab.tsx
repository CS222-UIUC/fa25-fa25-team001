"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Trash2, Film, Gamepad2, Tv, Filter, MessageSquare } from 'lucide-react';

interface User {
  id: string;
  username: string;
  profilePicture: string;
}

interface ReviewsTabProps {
  user: User;
}

interface Review {
  id: string;
  title?: string;
  content: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  movie?: { id: string; title: string; poster?: string };
  videoGame?: { id: string; title: string; cover?: string };
  tvShow?: { id: string; title: string; poster?: string };
}

export default function ReviewsTab({ user }: ReviewsTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadReviews();
  }, [user.id, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/list?userId=${user.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        let sortedReviews = data.reviews || [];
        
        // Sort reviews
        if (sortBy === 'highest') {
          sortedReviews.sort((a: Review, b: Review) => b.rating - a.rating);
        } else if (sortBy === 'lowest') {
          sortedReviews.sort((a: Review, b: Review) => a.rating - b.rating);
        }
        // 'recent' is default (already sorted by createdAt desc)
        
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Delete review error:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Reviews ({reviews.length})</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-secondary border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="grid gap-6">
          {reviews.map((review) => {
            const media = review.movie || review.videoGame || review.tvShow;
            const mediaType = review.movie ? 'movie' : review.videoGame ? 'game' : 'tv';
            const mediaImage = review.movie?.poster || review.videoGame?.cover || review.tvShow?.poster;
            const mediaLink = review.movie 
              ? `/movie/${review.movie.id}` 
              : review.videoGame 
                ? `/game/${review.videoGame.id}` 
                : `/tv/${review.tvShow?.id}`;

            return (
              <div key={review.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors flex flex-col md:flex-row gap-6">
                {/* Media Poster */}
                <Link href={mediaLink} className="flex-shrink-0 w-24 md:w-32 aspect-[2/3] bg-secondary rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all">
                  {mediaImage ? (
                    <img src={mediaImage} alt={media?.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link href={mediaLink} className="text-xl font-bold hover:text-primary transition-colors">
                        {media?.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">• {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {review.title && (
                    <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                  )}
                  
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "Start reviewing movies, games, and TV shows to see them here!" 
              : "This user hasn't written any reviews yet."}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => router.push('/search')}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Find something to review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
