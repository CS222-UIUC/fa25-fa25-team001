// Script to update existing media items with poster/cover images
// Run with: npx ts-node scripts/update-existing-media-posters.ts

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function updateMoviePosters() {
  const movies = await prisma.movie.findMany({
    where: {
      poster: null,
    },
  });

  console.log(`Found ${movies.length} movies without posters`);

  for (const movie of movies) {
    try {
      // Fetch from OMDB API
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${movie.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.Poster && data.Poster !== 'N/A') {
          await prisma.movie.update({
            where: { id: movie.id },
            data: { poster: data.Poster },
          });
          console.log(`Updated poster for movie: ${movie.title}`);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to update ${movie.title}:`, error);
    }
  }
}

async function updateTvShowPosters() {
  const tvShows = await prisma.tvShow.findMany({
    where: {
      poster: null,
    },
  });

  console.log(`Found ${tvShows.length} TV shows without posters`);

  for (const show of tvShows) {
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${show.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.Poster && data.Poster !== 'N/A') {
          await prisma.tvShow.update({
            where: { id: show.id },
            data: { poster: data.Poster },
          });
          console.log(`Updated poster for TV show: ${show.title}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to update ${show.title}:`, error);
    }
  }
}

async function updateGameCovers() {
  const games = await prisma.videoGame.findMany({
    where: {
      cover: null,
    },
  });

  console.log(`Found ${games.length} games without covers`);

  for (const game of games) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${game.id}?key=${process.env.RAWG_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.background_image) {
          await prisma.videoGame.update({
            where: { id: game.id },
            data: { cover: data.background_image },
          });
          console.log(`Updated cover for game: ${game.title}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to update ${game.title}:`, error);
    }
  }
}

async function main() {
  console.log('Starting to update existing media posters...\n');
  
  await updateMoviePosters();
  console.log('\n');
  
  await updateTvShowPosters();
  console.log('\n');
  
  await updateGameCovers();
  console.log('\n');
  
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
