# Google Business Profile Integration Setup Guide

The "Invalid Client" error (Error 401) occurs because the Google OAuth credentials in your `.env.local` file are currently placeholders. You need to create a Google Cloud Project and generate real credentials to make the integration work.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **New Project**.
3. Name it "Bayon CoAgent" (or similar) and click **Create**.

## Step 2: Enable APIs

1. In the sidebar, go to **APIs & Services > Library**.
2. Search for and enable the following APIs:
   - **Google Business Profile Performance API** (or "Google My Business API")
   - **Google Business Profile Management API** (if available/needed)
   - **Google Business Profile Information API**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you are a G-Suite user testing internally) and click **Create**.
3. Fill in the required fields:
   - **App Name**: Bayon CoAgent
   - **User Support Email**: Your email
   - **Developer Contact Information**: Your email
4. Click **Save and Continue**.
5. (Optional) Add "Test Users" if the app is in "Testing" mode. Add your own Google email address.

## Step 4: Create Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: "Bayon CoAgent Web Client".
5. **Authorized redirect URIs**:
   - Add: `http://localhost:3000/api/oauth/google/callback`
   - (If you deploy the app, add your production URL as well, e.g., `https://your-app.com/api/oauth/google/callback`)
6. Click **Create**.

## Step 5: Update Environment Variables

1. Copy the **Client ID** and **Client Secret** from the popup.
2. Open the `.env.local` file in your project root.
3. Replace the placeholders with your actual values:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

> **Note:** Ensure your application is running on port 3000. If it's running on a different port, update the `GOOGLE_REDIRECT_URI` in `.env.local` and in the Google Cloud Console to match.

## Step 6: Restart the Server

After updating `.env.local`, you must restart your Next.js development server for the changes to take effect:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Step 7: Test the Integration

1. Go to the **Settings** page in the app.
2. Click the **Integrations** tab.
3. Click **Connect** under Google Business Profile.
4. You should now be redirected to the Google consent screen instead of seeing the 401 error.
