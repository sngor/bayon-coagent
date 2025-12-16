# Social Media OAuth Setup Guide

This guide walks you through setting up OAuth credentials for Facebook, Instagram, LinkedIn, and Twitter integrations.

## Supported Platforms

The Bayon CoAgent platform supports OAuth integration with the following social media platforms:

- **Facebook**: Business pages, insights, and content publishing
- **Instagram**: Business account content publishing and analytics
- **LinkedIn**: Professional content sharing and analytics
- **Twitter**: Tweet publishing and engagement tracking

**Note**: Google Analytics and YouTube integrations have been removed to focus on core real estate social media workflows.

## LinkedIn OAuth Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information:
   - **App name**: Bayon Coagent (or your app name)
   - **LinkedIn Page**: Select your company page (or create one)
   - **App logo**: Upload your logo
   - **Legal agreement**: Accept the terms
4. Click "Create app"

### 2. Configure OAuth Settings

1. In your app dashboard, go to the "Auth" tab
2. Under "OAuth 2.0 settings":
   - **Redirect URLs**: Add your callback URLs:
     - Development: `http://localhost:3000/api/oauth/linkedin/callback`
     - Production: `https://yourdomain.com/api/oauth/linkedin/callback`
3. Click "Update"

### 3. Request API Access

1. Go to the "Products" tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (for authentication)
   - **Share on LinkedIn** (for posting content)
   - **Marketing Developer Platform** (optional, for advanced features)
3. Wait for approval (usually instant for basic features)

### 4. Get Your Credentials

1. Go to the "Auth" tab
2. Copy your credentials:
   - **Client ID**: This is your `LINKEDIN_CLIENT_ID`
   - **Client Secret**: Click "Show" to reveal, this is your `LINKEDIN_CLIENT_SECRET`

### 5. Update Environment Variables

Add to your `.env.local` file:

```bash
LINKEDIN_CLIENT_ID=your-actual-client-id
LINKEDIN_CLIENT_SECRET=your-actual-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (`.env.production`):

```bash
LINKEDIN_CLIENT_ID=your-actual-client-id
LINKEDIN_CLIENT_SECRET=your-actual-client-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 6. Test the Connection

1. Restart your development server: `npm run dev`
2. Go to Settings → Social Media Connections
3. Click "Connect" for LinkedIn
4. You should be redirected to LinkedIn for authorization
5. After authorizing, you'll be redirected back with a success message

## Facebook & Instagram OAuth Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in app details and create

### 2. Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" as the platform
4. Enter your site URL: `http://localhost:3000` (for development)

### 3. Configure OAuth Settings

1. Go to "Facebook Login" → "Settings"
2. Add OAuth Redirect URIs:
   - `http://localhost:3000/api/oauth/facebook/callback`
   - `http://localhost:3000/api/oauth/instagram/callback`
   - Add production URLs as well
3. Save changes

### 4. Get Your Credentials

1. Go to "Settings" → "Basic"
2. Copy:
   - **App ID**: This is your `FACEBOOK_APP_ID`
   - **App Secret**: Click "Show" to reveal, this is your `FACEBOOK_APP_SECRET`

### 5. Update Environment Variables

Add to your `.env.local` file:

```bash
FACEBOOK_APP_ID=your-actual-app-id
FACEBOOK_APP_SECRET=your-actual-app-secret
```

### 6. Instagram Business Account Requirements

To post to Instagram, you need:

1. An Instagram Business Account (not personal)
2. The Instagram account must be connected to a Facebook Page
3. You must be an admin of that Facebook Page

To convert to Business Account:

1. Open Instagram app
2. Go to Settings → Account
3. Switch to Professional Account → Business
4. Connect to your Facebook Page

## Troubleshooting

### "You need to pass the 'client_id' parameter"

This error means the environment variables are not loaded. Solutions:

1. Make sure you've added the credentials to `.env.local`
2. Restart your development server after adding environment variables
3. Verify the variable names match exactly (case-sensitive)

### "Invalid redirect_uri"

The callback URL in your OAuth provider settings doesn't match:

1. Check that the redirect URI in your app settings matches exactly
2. Include the protocol (`http://` or `https://`)
3. Don't include trailing slashes

### "Invalid scope"

The requested permissions aren't available:

1. Make sure you've requested the necessary products/permissions in your app
2. Wait for approval if required
3. Check that your app is in "Live" mode (not Development mode)

### LinkedIn Connection Works but Can't Post

1. Verify you have "Share on LinkedIn" product access
2. Check that your access token has the `w_member_social` scope
3. Make sure your LinkedIn account is a personal profile (not a company page)

### Instagram Connection Works but Can't Post

1. Verify you have an Instagram Business Account
2. Check that it's connected to a Facebook Page
3. Ensure you're an admin of that Facebook Page
4. Verify the Facebook Page has the Instagram account linked

## Security Best Practices

1. **Never commit credentials**: Keep `.env.local` in `.gitignore`
2. **Use different apps**: Create separate apps for development and production
3. **Rotate secrets**: Regularly rotate your client secrets
4. **Limit permissions**: Only request the OAuth scopes you actually need
5. **Monitor usage**: Check your app dashboards for unusual activity

## Twitter OAuth Setup

### 1. Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or "Create App"
3. Fill in the required information:
   - **App name**: Bayon Coagent (or your app name)
   - **App description**: Real estate content management platform
   - **Website URL**: Your domain or `http://localhost:3000` for development
4. Complete the app creation process

### 2. Configure OAuth Settings

1. In your app dashboard, go to "Settings" → "Authentication settings"
2. Enable "OAuth 2.0"
3. Add callback URLs:
   - Development: `http://localhost:3000/api/oauth/twitter/callback`
   - Production: `https://yourdomain.com/api/oauth/twitter/callback`
4. Save settings

### 3. Get Your Credentials

1. Go to "Keys and tokens" tab
2. Copy your credentials:
   - **API Key**: This is your `TWITTER_CLIENT_ID`
   - **API Secret**: This is your `TWITTER_CLIENT_SECRET`
   - **Bearer Token**: For API access

### 4. Update Environment Variables

Add to your `.env.local` file:

```bash
TWITTER_CLIENT_ID=your-actual-api-key
TWITTER_CLIENT_SECRET=your-actual-api-secret
TWITTER_BEARER_TOKEN=your-bearer-token
```

### 5. Test the Connection

1. Restart your development server: `npm run dev`
2. Go to Settings → Social Media Connections
3. Click "Connect" for Twitter
4. You should be redirected to Twitter for authorization
5. After authorizing, you'll be redirected back with a success message

## Required OAuth Scopes

### LinkedIn

- `openid` - User authentication
- `profile` - Basic profile information
- `email` - User email address
- `w_member_social` - Post to LinkedIn

### Facebook

- `pages_show_list` - List user's pages
- `pages_read_engagement` - Read page data
- `pages_manage_posts` - Post to pages

### Instagram

- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Publish content
- `pages_show_list` - Required for Instagram Business Account

### Twitter

- `tweet.read` - Read tweets
- `tweet.write` - Post tweets
- `tweet.moderate.write` - Moderate tweets
- `follows.read` - Read follower information
- `users.read` - Read user information

## Next Steps

After setting up OAuth:

1. Test each connection in the Settings page
2. Try publishing a test post to each platform
3. Monitor the connection status and token expiration
4. Set up error notifications for failed posts

## MLS Provider Setup

### Overview

The MLS integration uses the RESO Web API standard to connect to MLS providers. You'll need API credentials from your MLS provider.

### Supported MLS Providers

1. **FlexMLS** (FBS/FlexMLS)
2. **CRMLS** (California Regional MLS)
3. **BrightMLS** (Bright MLS)
4. **MLS Grid** (MLS Grid Network)

### Getting MLS API Credentials

#### FlexMLS

1. Contact your FlexMLS administrator or FBS support
2. Request RESO Web API access for your account
3. You'll receive:
   - Client ID
   - Client Secret
   - API endpoint URL
4. Add to `.env.local`:
   ```bash
   FLEXMLS_API_URL=https://api.flexmls.com/v1
   FLEXMLS_CLIENT_ID=your-client-id
   FLEXMLS_CLIENT_SECRET=your-client-secret
   ```

#### CRMLS

1. Log into your CRMLS account
2. Go to Developer Tools or API Access
3. Request RESO Web API credentials
4. Add to `.env.local`:
   ```bash
   CRMLS_API_URL=https://api.crmls.org/RESO/OData
   CRMLS_CLIENT_ID=your-client-id
   CRMLS_CLIENT_SECRET=your-client-secret
   ```

#### BrightMLS

1. Contact BrightMLS support
2. Request RESO Web API access
3. Complete any required agreements
4. Add to `.env.local`:
   ```bash
   BRIGHT_API_URL=https://api.brightmls.com/RESO/OData
   BRIGHT_CLIENT_ID=your-client-id
   BRIGHT_CLIENT_SECRET=your-client-secret
   ```

#### MLS Grid

1. Visit [MLS Grid Developer Portal](https://developer.mlsgrid.com/)
2. Create a developer account or log in
3. Register your application
4. Request production API access
5. You'll receive:
   - Client ID
   - Client Secret
   - API endpoint URL
6. Add to `.env.local`:
   ```bash
   MLSGRID_API_URL=https://api.mlsgrid.com/v2
   MLSGRID_CLIENT_ID=your-client-id
   MLSGRID_CLIENT_SECRET=your-client-secret
   ```

**Note**: MLS Grid provides access to multiple MLS systems through a single API. You'll need to specify which MLS system you're connecting to when authenticating.

### Testing MLS Connection

1. Restart your dev server after adding credentials
2. Go to Settings → Integrations
3. Click "Connect MLS"
4. Select your MLS provider
5. Enter your MLS username and password (same as you use to log into MLS)
6. Click "Connect"
7. If successful, you'll see your agent and brokerage information
8. Click "Sync Now" to import your listings

### MLS Connection Features

- **Automatic Sync**: Listings sync every 15 minutes
- **Status Tracking**: Automatically detects when listings go pending/sold
- **Photo Storage**: Downloads and stores listing photos in S3
- **Retry Logic**: Automatically retries failed imports with exponential backoff

### MLS Troubleshooting

#### "Authentication failed"

- Verify your MLS username and password are correct
- Check that you have API access enabled with your MLS provider
- Ensure your MLS account is active and in good standing

#### "Access token expired"

- Click "Disconnect" and reconnect your MLS account
- MLS tokens typically expire after 24 hours

#### "Failed to fetch listings"

- Verify you have active listings in your MLS
- Check that your agent ID is correct
- Contact your MLS provider to verify API access

#### "No listings imported"

- Ensure you have active listings assigned to your agent ID
- Check that listings are in "Active" status in MLS
- Verify your MLS provider is supported (FlexMLS, CRMLS, BrightMLS, or MLS Grid)
- For MLS Grid, ensure you've specified the correct MLS system

## Complete Setup Workflow

1. **Social Media OAuth**: Connect Facebook, Instagram, and LinkedIn accounts
2. **MLS Connection**: Connect your MLS provider and import listings
3. **Publish Listings**: Go to Library → Listings and publish to social media
4. **Monitor**: Check sync history and connection status regularly
