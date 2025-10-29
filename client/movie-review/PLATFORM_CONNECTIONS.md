# Gaming Platform Connections

This feature allows users to **link** their gaming platform accounts (Steam, Nintendo, Xbox, PlayStation) to sync playtime data.

⚠️ **Important**: These are account **linkages only** - users still sign in with their email/password. Platform accounts are only used to access gaming data.

## Supported Platforms

### ✅ Steam (Currently Implemented)
Connect your Steam account to view your game library, playtime, and last played dates.

**Setup Instructions:**
1. Get a Steam Web API Key from [Steam](https://steamcommunity.com/dev/apikey)
2. Add it to your `.env` file:
   ```
   STEAM_API_KEY=your_api_key_here
   ```
3. Find your Steam ID at [steamid.io](https://steamid.io/) or [steamdb.info](https://steamdb.info/calculator/)
4. Navigate to your profile page and connect your Steam account

### 🚧 Nintendo Switch (Coming Soon)
Full OAuth integration pending.

### 🚧 Xbox/Microsoft (Coming Soon)
Full OAuth integration pending.

### 🚧 PlayStation (Coming Soon)
Full OAuth integration pending.

## How It Works

### User Flow
1. User signs in with their **email/password** (existing authentication system)
2. User navigates to their profile page
3. User **links** their gaming platform by entering Steam ID (or OAuth for other platforms)
4. User clicks "Sync Games" to fetch their library
5. User views playtime data and last played dates

**Note**: Linking a gaming platform does NOT change how users sign in. Email/password remains the only login method.

### Database Schema

```prisma
model PlatformConnection {
  id             String   @id @default(cuid())
  platformType   String   // 'steam', 'nintendo', 'xbox', 'playstation'
  platformUserId String?  // User's ID on the external platform
  accessToken    String?  // OAuth token (encrypted in production)
  refreshToken   String?  // OAuth refresh token
  expiresAt      DateTime?// Token expiration
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  userId         String
  lastSyncedAt   DateTime?// Last time data was synced
  gamesData      Json?    // Cached game data
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, platformType])
}
```

## API Endpoints

### Steam
- `POST /api/platforms/steam/connect` - Connect Steam account
- `GET /api/platforms/steam/games` - Fetch games and playtime data

### Platforms (General)
- `DELETE /api/platforms/disconnect?platformType=steam` - Disconnect platform

## Server Actions

Located in `src/actions/platform.ts`:
- `getUserPlatformConnections()` - Get all connections for current user
- `connectPlatform()` - Connect a platform account
- `disconnectPlatform()` - Remove a platform connection
- `updatePlatformData()` - Update cached game data

## UI Components

### PlatformConnections
Located in `src/components/PlatformConnections.tsx`

Features:
- List all supported platforms
- Connect/Disconnect functionality
- Sync game data
- Display cached playtime information
- Show last sync timestamp

### Profile Page
Updated `src/app/user/profile/page.tsx` to include the PlatformConnections component.

## Running Database Migrations

After updating the schema, run:

```bash
npx prisma migrate dev --name add_platform_connections
```

Or to update the database without creating a migration:

```bash
npx prisma db push
```

## Future Enhancements

1. **OAuth Integration** - Full OAuth for Nintendo, Xbox, and PlayStation
2. **Auto-Sync** - Background jobs to automatically sync playtime data
3. **Analytics** - Chart total playtime across all platforms
4. **Trophies/Achievements** - Display earned achievements
5. **Game Recommendations** - Suggest games based on play history
6. **Privacy Controls** - Allow users to hide playtime data
7. **Social Sharing** - Share gaming stats with friends

## Security Notes

⚠️ **Important**: In production, you should encrypt `accessToken` and `refreshToken` fields in the database. Consider using a library like `@hapi/iron` or `jose` for token encryption.

## Troubleshooting

### Steam API Issues
- Ensure your Steam API key is valid
- Check that the Steam ID format is correct (17 digits for Steam64 ID)
- Verify the user's Steam profile is public

### Database Issues
- Run `npx prisma generate` after schema changes
- Ensure migrations are applied: `npx prisma migrate deploy`

