"use client";

import { useState, useRef } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'overlay'; // 'inline' for forms, 'overlay' for favorites hover
  showValue?: boolean; // Show numeric value next to stars
  className?: string; // Additional classes for container
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  variant = 'inline',
  showValue = false,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayRating = hoverRating ?? rating;

  // Mouse move handler for precise half-star selection (used in overlay variant)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readonly || variant !== 'overlay' || !containerRef.current) return;

    const starContainer = containerRef.current.querySelector('div.flex');
    if (!starContainer) return;

    const starRect = starContainer.getBoundingClientRect();
    const starX = e.clientX - starRect.left;
    const starWidth = starRect.width;

    // Add padding area on both sides for easier 0.5 and 5.0 rating
    const padding = starWidth * 0.1; // 10% padding on each side
    const adjustedX = starX + padding;
    const adjustedWidth = starWidth + padding * 2;

    const starWidthEach = adjustedWidth / 5;
    const starIndex = Math.floor(adjustedX / starWidthEach);
    const positionInStar = (adjustedX % starWidthEach) / starWidthEach;

    const isHalfStar = positionInStar < 0.5;
    const starValue = starIndex + 1;
    const finalRating = isHalfStar ? starIndex + 0.5 : starValue;

    // Clamp between 0.5 and 5.0
    let clampedRating = Math.max(0.5, Math.min(5.0, finalRating));

    // Ensure we can reach 0.5 by checking if we're at the very left edge
    if (starX < padding * 0.5) {
      clampedRating = 0.5;
    }
    // Ensure we can reach 5.0 by checking if we're at the very right edge
    if (starX > starWidth - padding * 0.5) {
      clampedRating = 5.0;
    }

    setHoverRating(clampedRating);
  };

  // Click handler for overlay variant (uses hover rating)
  const handleOverlayClick = () => {
    if (readonly || variant !== 'overlay' || hoverRating === null) return;
    if (onRatingChange) {
      onRatingChange(hoverRating);
    }
  };

  // Click handler for inline variant (click on specific star)
  const handleStarClick = (starValue: number) => {
    if (readonly || variant !== 'inline' || !onRatingChange) return;
    onRatingChange(starValue);
  };

  // Mouse enter handler for inline variant (hover over specific star)
  const handleStarMouseEnter = (starValue: number) => {
    if (readonly || variant !== 'inline') return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(null);
    }
  };

  const renderStar = (starValue: number) => {
    const isFullStar = displayRating >= starValue;
    const isHalfStar = displayRating >= starValue - 0.5 && displayRating < starValue;

    return (
      <div key={starValue} className={`relative ${sizeClasses[size]}`}>
        {/* Empty star background - always visible */}
        <svg
          className={`w-full h-full text-gray-300 ${variant === 'inline' && !readonly ? 'hover:text-gray-400' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {/* Filled star overlay - half or full */}
        {(isFullStar || isHalfStar) && (
          <div
            className="absolute top-0 left-0 h-full w-full"
            style={{
              clipPath: isHalfStar ? 'inset(0 50% 0 0)' : 'none',
            }}
          >
            <svg
              className="w-full h-full text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Overlay variant (for favorites section)
  if (variant === 'overlay') {
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 cursor-pointer ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleOverlayClick}
      >
        <div className="flex items-center gap-1 px-2" style={{ direction: 'ltr' }}>
          {[1, 2, 3, 4, 5].map(renderStar)}
        </div>
        {rating > 0 && (
          <div className="absolute bottom-4 text-white text-xs font-semibold">
            Your rating: {rating.toFixed(1)} ⭐
          </div>
        )}
      </div>
    );
  }

  // Inline variant (for forms and reviews)
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {renderStar(starValue)}
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {displayRating > 0 ? displayRating.toFixed(1) : '0.0'} / 5.0
        </span>
      )}
    </div>
  );
}
