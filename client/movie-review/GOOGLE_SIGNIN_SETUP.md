# Google Sign-In Setup Instructions

## Error: redirect_uri_mismatch

If you're getting the `redirect_uri_mismatch` error, you need to configure the authorized redirect URIs in Google Cloud Console.

## Steps to Fix:

### 1. Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with client ID: `544117421120-m7dmair6nqjo89pcu2kvsoq4a64h003p`)

### 2. Navigate to OAuth 2.0 Client ID Settings
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (the one ending in `...h003p.apps.googleusercontent.com`)
3. Click the **Edit** (pencil) icon

### 3. Add Authorized Redirect URIs
In the **Authorized redirect URIs** section, add the following URIs:

**For Local Development:**
```
http://localhost:3000
http://localhost:3000/
```

**For Production (when deployed):**
```
https://yourdomain.com
https://yourdomain.com/
```

**Important Notes:**
- Make sure there are NO trailing slashes unless you specifically include them
- Use `http://` for localhost, `https://` for production
- The URI must match EXACTLY (including protocol, port, and path)

### 4. Add Authorized JavaScript Origins
In the **Authorized JavaScript origins** section, add:

**For Local Development:**
```
http://localhost:3000
```

**For Production:**
```
https://yourdomain.com
```

### 5. Save Changes
Click **Save** and wait a few minutes for changes to propagate.

### 6. Test Again
Try signing in with Google again. The error should be resolved.

## Additional Configuration

### Application Type
Make sure your OAuth 2.0 Client ID is configured as:
- **Application type**: Web application

### Scopes
The current implementation requests:
- `profile` - Basic profile information
- `email` - User's email address

These are included by default with Google Sign-In.

## Troubleshooting

### Still Getting the Error?
1. **Wait a few minutes** - Changes can take 5-10 minutes to propagate
2. **Clear browser cache** - Sometimes cached redirect URIs cause issues
3. **Check the exact error** - The error message might show the exact URI Google is trying to use
4. **Verify the URI format** - Make sure there are no extra characters or spaces

### Check Current Redirect URI
When you click the sign-in button, check the browser console or network tab to see what redirect URI is being used. It should match one of the URIs you added in Google Cloud Console.

## Next Steps

After fixing the redirect URI issue, you'll need to:
1. Handle the Google sign-in response in your application
2. Send the ID token to your backend for authentication
3. Create or update the user account in your database
4. Set up a session using NextAuth or your authentication system

