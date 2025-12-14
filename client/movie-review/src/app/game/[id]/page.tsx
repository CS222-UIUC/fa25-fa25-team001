"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Link from 'next/link';
import { Star, Calendar, User, Gamepad2 } from 'lucide-react';

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
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const gameId = params.id as string;
  const [game, setGame] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ title: '', content: '', rating: 5 });

  useEffect(() => {
    if (gameId) {
      loadGameDetails();
      loadReviews();
    }
  }, [gameId]);

  const loadGameDetails = async () => {
    try {
      const response = await fetch(`/api/rawg/games?q=${gameId}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.games && data.games.length > 0) {
          setGame(data.games[0]);
        } else {
          // Try to get by ID directly if search failed (sometimes ID is passed directly)
          const idResponse = await fetch(`/api/rawg/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameIds: [parseInt(gameId)] }),
          });
          if (idResponse.ok) {
            const idData = await idResponse.json();
            if (idData.games && idData.games.length > 0) {
              setGame(idData.games[0]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/list?videoGameId=${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          videoGameId: gameId,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setReviewForm({ title: '', content: '', rating: 5 });
        await loadReviews();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create review');
      }
    } catch (error) {
      console.error('Create review error:', error);
      alert('Failed to create review');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
          <button
            onClick={() => router.push('/search')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Search Games
          </button>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero / Game Header */}
      <div className="relative">
        {/* Background Blur */}
        <div className="absolute inset-0 overflow-hidden h-[500px] z-0">
          {game.background_image && (
            <img 
              src={game.background_image} 
              alt="" 
              className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-64 aspect-[16/9] md:aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {game.background_image ? (
                  <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                    <Gamepad2 className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{game.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm text-muted-foreground">
                {game.released && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(game.released).getFullYear()}</span>
                  </div>
                )}
                {game.genres && game.genres.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                    {game.genres[0].name}
                  </span>
                )}
                {game.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    RAWG: {game.rating}
                  </span>
                )}
              </div>

              {averageRating > 0 && (
                <div className="mb-8 flex items-center justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {session?.user?.id && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
                >
                  {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Reviews */}
          <div className="md:col-span-2 space-y-8">
            {/* Review Form */}
            {showReviewForm && session?.user?.id && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-200">
                <h2 className="text-xl font-bold mb-4">Write a Review</h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title (optional)</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Review title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating })}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`h-8 w-8 ${rating <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Review</label>
                    <textarea
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      rows={6}
                      required
                      className="w-full px-4 py-2 bg-secondary border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Share your thoughts..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Reviews</h2>
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <Link href={`/profile/${review.user.username}`} className="flex-shrink-0">
                          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden ring-2 ring-background">
                            {review.user.profilePicture && review.user.profilePicture !== '/default.jpg' ? (
                              <img src={review.user.profilePicture} alt={review.user.username} className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <Link href={`/profile/${review.user.username}`} className="font-semibold hover:text-primary transition-colors truncate">
                              {review.user.username}
                            </Link>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            {renderStars(review.rating)}
                          </div>
                          {review.title && (
                            <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
                          )}
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info (Plot, etc) */}
          <div className="space-y-6">
            {/* RAWG doesn't always provide a short description in the list view, but we can try */}
            {/* If we had a description, we would show it here */}
            
            {/* Additional metadata */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Game Info</h3>
              
              {game.platforms && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Platforms</span>
                  <div className="flex flex-wrap gap-2">
                    {game.platforms.map((p: any) => (
                      <span key={p.platform.id} className="text-xs px-2 py-1 bg-secondary rounded-md">
                        {p.platform.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.publishers && game.publishers.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Publisher</span>
                  <span className="text-sm">{game.publishers[0].name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
