"use client";

import { useEffect, useState } from 'react';
import { createReview, getMyReviews } from '@/actions/media';

interface Review {
  id: string;
  movieTitle: string;
  rating: number;
  comment: string;
  date: string;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const [newReview, setNewReview] = useState({
    movieTitle: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyReviews();
        setReviews((data as any).reviews || []);
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.movieTitle.trim() || !newReview.comment.trim()) return;

    try {
      const data = await createReview({
        movieTitle: newReview.movieTitle,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      if ((data as any)?.review) {
        setReviews([(data as any).review, ...reviews]);
        setNewReview({ movieTitle: '', rating: 5, comment: '' });
      }
    } catch {}
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Movie Reviews</h1>

      {/* Add Review Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movie Title
            </label>
            <input
              type="text"
              value={newReview.movieTitle}
              onChange={(e) => setNewReview({...newReview, movieTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter movie title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              placeholder="Write your review..."
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{review.movieTitle}</h3>
              <span className="text-sm text-gray-500">{review.date}</span>
            </div>
            <div className="mb-3">
              <span className="text-lg">{renderStars(review.rating)}</span>
              <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}