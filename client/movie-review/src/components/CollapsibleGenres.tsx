'use client';

import { useState } from 'react';

interface Genre {
  name: string;
}

interface CollapsibleGenresProps {
  genres: Genre[];
}

export default function CollapsibleGenres({ genres }: CollapsibleGenresProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800 transition-colors"
      >
        <span>Genres</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 flex flex-wrap gap-2">
          {genres.map((genre, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-cyan-500/20 text-cyan-800 rounded-full text-sm"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


