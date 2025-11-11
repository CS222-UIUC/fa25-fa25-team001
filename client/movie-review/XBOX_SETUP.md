# Xbox Platform Integration

Xbox platform support has been added to allow users to link their Xbox accounts and track game playtime.

## Configuration

### Environment Variables
The Xbox API key has been added to your `.env` file:
```env
XBOX_API_KEY=eb6e2f53-925d-49d6-b9be-130a87b5af69
```

## Files Created

### API Routes
- `src/app/api/platforms/xbox/connect/route.ts` - Connect Xbox account by User ID
- `src/app/api/platforms/xbox/games/route.ts` - Fetch Xbox games (placeholder implementation)

### UI Integration
- Updated `src/components/PlatformConnections.tsx` to include full Xbox UI

## How It Works

### User Flow
1. User navigates to `/user/profile` page
2. User enters their Xbox User ID
3. User clicks "Connect Xbox"
4. Connection is saved to database
5. User can click "Sync Games" to fetch their game library

### Current Implementation

**Connection**: ✅ Fully working
- Users can link their Xbox account with an Xbox User ID
- Connection is stored in the `platform_connections` table

**Game Sync**: ⚠️ Placeholder
- Basic structure is in place
- Requires proper Xbox Live API authentication
- Currently returns empty game list
- API route accepts connections and stores empty data structure

## Next Steps for Full Implementation

To complete the Xbox integration, you'll need to:

1. **Xbox Live API Authentication**
   - Set up Microsoft Azure app registration
   - Configure OAuth 2.0 flow for Xbox Live
   - Get proper authentication tokens

2. **Xbox Live API Integration**
   - Use the Xbox Live APIs to fetch user's game library
   - Get playtime data for each game
   - Track last played dates

3. **Resources**
   - [Xbox Live API Documentation](https://docs.microsoft.com/en-us/gaming/xbox-live/xbox-live-rest/uri/atoc-xbox-live-rest)
   - [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

## Testing

To test the Xbox connection:
1. Start your dev server: `npm run dev`
2. Log in and go to `/user/profile`
3. Scroll to "Link Gaming Platforms" section
4. Enter an Xbox User ID and click "Connect Xbox"
5. You should see the connection succeed

**Note**: The games endpoint currently returns a placeholder message. Full game sync requires OAuth implementation.

