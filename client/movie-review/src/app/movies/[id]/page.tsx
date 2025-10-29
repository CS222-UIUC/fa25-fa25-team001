import MovieHeader from "@/components/MovieHeader";
import MovieRatingsSection from "@/components/MovieRatingsSection";

type PageProps = {
  params: { id: string };
};

export default async function MoviePage({ params }: PageProps) {
  // Placeholder movie information
  const movie = {
    id: params.id,
    title: "Sample Movie",
    releaseYear: 2025,
    director: "Director Name",
    posterUrl: "/vercel.svg",
    summary:
      "Summary, plot, taglines, etc. of the movie in this section.",
  };

  const stats = {
    average: 4.2,
    count: 128,
    breakdown: { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 },
  } as const;

  const recentReviews = [
    {
      id: "r1",
      user: { id: "u1", username: "user1" },
      rating: 4.5,
      content: "Sample review text.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "r2",
      user: { id: "u2", username: "user2" },
      rating: 4,
      content: "More sample review text.",
      createdAt: new Date().toISOString(),
    },
  ];

  async function submitReview(rating: number, reviewText: string) {
    "use server";
    // TODO: persist review via Prisma using params.id and the session user
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-8">
      <MovieHeader
        posterUrl={movie.posterUrl}
        title={movie.title}
        releaseYear={movie.releaseYear}
        director={movie.director}
        summary={movie.summary}
      />

      <MovieRatingsSection
        stats={stats}
        onSubmitReview={submitReview}
        recentReviews={recentReviews}
      />
    </main>
  );
}


