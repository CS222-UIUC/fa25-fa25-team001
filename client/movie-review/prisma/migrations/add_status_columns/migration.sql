-- AlterTable
ALTER TABLE "movies_watched" ADD COLUMN IF NOT EXISTS "status" TEXT;

-- AlterTable
ALTER TABLE "tv_shows_watched" ADD COLUMN IF NOT EXISTS "status" TEXT;

-- AlterTable
ALTER TABLE "video_games_played" ADD COLUMN IF NOT EXISTS "status" TEXT;

