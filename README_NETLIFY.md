# Netlify Deployment Guide

This application is now configured for deployment on Netlify.

## Steps to Deploy

1. **Push to GitHub/GitLab/Bitbucket**:
   Ensure your code is in a remote repository.

2. **Connect to Netlify**:
   - Log in to [Netlify](https://app.netlify.com/).
   - Click **"Add new site"** > **"Import an existing project"**.
   - Select your repository.

3. **Configure Build Settings**:
   Netlify should automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

4. **Set Environment Variables**:
   In Netlify, go to **Site settings** > **Environment variables** and add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NODE_ENV`: Set to `production`.
   - `DATABASE_URL`: (Optional) Your Neon PostgreSQL connection string. If not provided, a default one is used.

5. **CORS and Access Denied Fixes**:
   - Added `cors` middleware with explicit options.
   - Refactored `app.ts` to use an Express Router for more robust path handling.
   - Updated `netlify.toml` redirects to ensure API requests are correctly routed to the serverless function.
   - Added logging to the backend to help troubleshoot any remaining issues.

## How it Works
- **Frontend**: The React app is built using Vite into the `dist` folder.
- **Backend**: The Express server is wrapped in a Netlify Function located at `netlify/functions/server.ts`.
- **Routing**: `netlify.toml` redirects all `/api/*` requests to the serverless function.
