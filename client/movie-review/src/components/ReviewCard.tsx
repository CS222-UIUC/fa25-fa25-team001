"use client";

import { useState } from 'react';
import StarRating from './StarRating';

interface User {
  id: string;
  username: string;
  profilePicture: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: User;
}

interface ReviewCardProps {
  review: {
    id: string;
    title?: string;
    content: string;
    rating: number;
    createdAt: string | Date;
    user: User;
    mediaType: 'movie' | 'game' | 'tv' | null;
    media: {
      id: string;
      title: string;
      year?: number | null;
      posterUrl?: string | null;
    } | null;
    likesCount: number;
    isLiked: boolean;
    comments: Comment[];
  };
  onLike: (reviewId: string) => Promise<void>;
  onComment: (reviewId: string, content: string) => Promise<void>;
}

export default function ReviewCard({ review, onLike, onComment }: ReviewCardProps) {
  const [isLiked, setIsLiked] = useState(review.isLiked);
  const [likesCount, setLikesCount] = useState(review.likesCount);
  const [comments, setComments] = useState(review.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLike(review.id);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    } catch (error) {
      console.error('Error liking review:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onComment(review.id, commentText);
      // The comment will be added via the parent component refreshing
      setCommentText('');
      setShowComments(true);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const mediaTypeLabel = review.mediaType === 'movie' ? 'Movie' : review.mediaType === 'game' ? 'Game' : review.mediaType === 'tv' ? 'TV Show' : 'Media';

  return (
    <div className="glass-strong rounded-2xl shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <img
            src={review.user.profilePicture || '/default.jpg'}
            alt={review.user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-gray-900">{review.user.username}</div>
            <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
          </div>
        </div>
        {review.media && (
          <div className="flex items-center gap-3">
            {review.media.posterUrl && (
              <img
                src={review.media.posterUrl}
                alt={review.media.title}
                className="w-16 h-24 object-cover rounded-lg shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">{mediaTypeLabel}</div>
              <div className="text-sm text-gray-600 font-semibold">{review.media.title}</div>
              {review.media.year && (
                <div className="text-xs text-gray-500">{review.media.year}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating 
          rating={review.rating} 
          readonly 
          variant="inline"
          size="sm"
        />
      </div>

      {/* Title */}
      {review.title && (
        <h3 className="text-xl font-bold text-gray-900 mb-2">{review.title}</h3>
      )}

      {/* Content */}
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            isLiked
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium">{comments?.length || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-2"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={comment.user.profilePicture || '/default.jpg'}
                    alt={comment.user.username}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

