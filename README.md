# Music Streaming App

Full-stack music streaming app with authentication, profile management, interactive song browsing, and account-specific playlists.

## Tech Stack

- Frontend: React, Vite, Axios, React Router, Tailwind CSS
- Backend: Node.js, Express
- Auth: JWT + HttpOnly cookie (Bearer token fallback supported)
- Persistence:
- MongoDB for full production persistence
- In-memory fallback for local/dev continuity when MongoDB is unavailable

## Project Structure

- backend: Express API (auth, songs, playlists)
- frontend: React SPA client

## Implemented Features

- User registration and login
- Session validation and profile fetch
- Password update for authenticated user
- Song catalog fetch with search support
- Song likes and comments
- Playlist create/read/update/delete
- Add/remove/reorder songs in playlists
- Playlist repair for legacy song references
- Playlist like and comment interactions
- Playlist sharing URL support
- Account-scoped playlists (different users see different playlists)

## Key Fixes Included

- CORS handling improved to avoid blocked frontend API requests across common hosts.
- Register flow guarded to prevent duplicate submissions from one click.
- Playlist storage moved to backend account scope (no shared playlist localStorage behavior).
- Add to Playlist action stabilized with request locking and backend fallback compatibility.
- Frontend responsiveness improved with guarded async actions and lazy image loading.

## Environment Variables

Backend (.env):

- PORT: optional, default 5000
- JWT_SECRET: required in production
- MONGO_URI: optional for local testing, recommended in production
- FRONTEND_URL, FRONTEND_ORIGIN, CLIENT_URL, APP_URL: optional CORS allow-list entries
- FRONTEND_URLS: optional comma-separated CORS allow-list
- NETLIFY_URL, VERCEL_URL: optional platform URL hints
- CORS_ALLOW_ALL: set true to allow all frontend origins (use carefully in production)

Frontend (.env):

- VITE_API_URL: backend base URL, typically https://<backend-host>/api
- VITE_API_ORIGIN: optional backend origin; /api is appended if missing
- VITE_ALLOW_REMOTE_DEV_API: true to use remote backend while running local frontend dev server

## Local Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Build Validation

Frontend production build:

```bash
cd frontend
npm run build
```

Backend startup check:

```bash
cd backend
npm start
```

## Functional Verification Checklist

1. Register a new user account and confirm only one register request is processed per submit.
2. Login and verify profile/session loads.
3. Create playlist and add songs from the song list.
4. Confirm playlist opens with added songs.
5. Logout, login with another account, and verify playlists are isolated.
6. Re-login as first user and verify original playlists remain.
7. Remove and reorder songs and confirm updates persist.
8. Test with MongoDB disconnected and confirm fallback playlist operations still work per account.

## API Health Endpoints

- GET /health
- GET /api
- GET /api/health

## Postman Quick Verify

Import these files:

- postman/MusicStreamingApp.postman_collection.json
- postman/MusicStreamingApp.postman_environment.json

Set environment values:

- baseUrl = https://your-backend-service.onrender.com/api
- baseUrlNoApi = https://your-backend-service.onrender.com
- email = your test user email
- password = your test user password

Run in order:

1. 1. Health -> GET /api/health
2. 2. Auth -> POST Register
3. 2. Auth -> POST Login
4. 4. Playlists (Auth Required) -> GET Playlists
5. 4. Playlists (Auth Required) -> POST Create Playlist
6. 3. Songs -> GET Songs
7. 4. Playlists (Auth Required) -> POST Add Song To Playlist

Notes:

- The collection auto-saves authToken from login/register tests.
- playlistId and songId are auto-saved from create playlist and songs calls.
- If Register returns 409, continue with Login (account already exists).
