"use client"
import { useState } from "react";

type RatingStats = {
  average: number;
  count: number;
  breakdown?: Record<string, number>;
};

type MovieRatingsSectionProps = {
  stats: RatingStats;
  onSubmitReview?: (rating: number, reviewText: string) => Promise<void> | void;
  recentReviews: Array<{
    id: string;
    user: { id: string; username: string };
    rating: number;
    content: string;
    createdAt: string | Date;
  }>;
};

export default function MovieRatingsSection({ stats, onSubmitReview, recentReviews }: MovieRatingsSectionProps) {
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitReview) return;
    setSubmitting(true);
    try {
      await onSubmitReview(rating, text);
      setRating(0);
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full mt-10">
      <h2 className="text-2xl font-semibold mb-4">Ratings & Reviews</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-md border p-4">
          <div className="text-4xl font-bold">{stats.average.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average rating • {stats.count} ratings</div>
          {stats.breakdown && (
            <div className="mt-4 space-y-1">
              {Object.entries(stats.breakdown).map(([label, value]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-12 text-sm text-gray-700">{label}★</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-gray-800 rounded" style={{ width: `${Math.min(100, value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-md border p-4 space-y-3 lg:col-span-2">
          <label className="block text-sm font-medium">Your rating</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-24 border rounded px-2 py-1"
            />
            <span className="text-sm text-gray-600">0–5 (half steps)</span>
          </div>

          <label className="block text-sm font-medium mt-2">Your review</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border rounded px-2 py-2"
            placeholder="Share your thoughts..."
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !onSubmitReview}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Recent reviews</h3>
        <ul className="space-y-4">
          {recentReviews.length === 0 && (
            <li className="text-gray-600 text-sm">No reviews yet.</li>
          )}
          {recentReviews.map((r) => (
            <li key={r.id} className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-700">{r.user.username}</div>
                <div className="text-sm font-medium">{r.rating.toFixed(1)}★</div>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{r.content}</p>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


