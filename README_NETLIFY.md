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
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.

5. **Deploy**:
   Click **"Deploy site"**.

## How it Works
- **Frontend**: The React app is built using Vite into the `dist` folder.
- **Backend**: The Express server is wrapped in a Netlify Function located at `netlify/functions/api.ts`.
- **Routing**: `netlify.toml` redirects all `/api/*` requests to the serverless function.
