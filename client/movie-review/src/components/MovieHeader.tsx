import Image from "next/image";

type MovieHeaderProps = {
  posterUrl: string;
  title: string;
  releaseYear?: number | null;
  director?: string | null;
  summary?: string | null;
};

export default function MovieHeader({ posterUrl, title, releaseYear, director, summary }: MovieHeaderProps) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="relative w-full h-[300px] md:h-[300px] rounded-md overflow-hidden bg-gray-200">
          {posterUrl ? (
            <Image src={posterUrl} alt={`${title} poster`} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No poster</div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <div className="text-sm text-gray-600">
            <span>{releaseYear ?? "Unknown year"}</span>
            <span className="mx-2">•</span>
            <span>{director ?? "Unknown director"}</span>
          </div>
          {summary ? (
            <p className="text-base leading-7 text-gray-800">{summary}</p>
          ) : (
            <p className="text-base leading-7 text-gray-500">No summary available.</p>
          )}
        </div>
      </div>
    </section>
  );
}


