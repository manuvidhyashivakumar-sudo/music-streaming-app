# Music Streaming App

Full-stack music streaming application with account-based authentication, playlist management, and playback controls.

## Tech Stack

- Frontend: React + Vite + Axios + React Router
- Backend: Node.js + Express
- Database: MongoDB (required for playlist persistence)
- Auth: JWT in HttpOnly secure session cookie

## Repository Structure

- `backend/`: API server, auth, songs, playlists
- `frontend/`: React client

## Features

- User registration and login
- Authenticated profile and password update
- Song listing, search, like, and comments
- Account-scoped playlists (each user only sees their own playlists)
- Add/remove songs from playlists
- Responsive player UI with controls

## Important Behavior

- Playlist data is handled by the backend and associated with the logged-in user.
- Playlists are not stored in shared browser `localStorage` anymore.
- Authentication tokens are not stored in frontend local storage; the server sets an HttpOnly cookie.
- The Add to Playlist action requires login and a selected/created playlist.

## Setup

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Environment variables:

- `PORT` (optional, default `5000`)
- `JWT_SECRET` (required in production; use a strong random value)
- `MONGO_URI` (required for playlist CRUD)
- `FRONTEND_URL` (optional, for CORS)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:

- `VITE_API_URL` (for deployed backend URL)
- `VITE_ALLOW_REMOTE_DEV_API=true` (optional; allows dev server to use `VITE_API_URL` instead of localhost)

## Manual Verification Checklist

- Register a new account.
- Login with the new account.
- Create a playlist.
- Add at least one song from Home/Search to that playlist.
- Open Playlists page and verify the song appears.
- Logout, login with a different account, and verify playlists are different.
- Remove song from playlist and verify it updates immediately.

## Notes

Playlist operations are strictly database-backed and require both a valid JWT token and MongoDB connectivity.
