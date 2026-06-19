# Impostor — Frontend

> **⚠️ Unmaintained / Learning Project**
>
> Built to learn about WebSockets in the browser, real-time UI state management, and frontend
> deployment with Docker. **Not finished, no further updates.** See the
> [backend repo](https://github.com/LautaroBlasco23/impostor-backend) for the server side.

React + TypeScript frontend for a multiplayer word-guessing game. Connects to the game server via
WebSocket for real-time gameplay.

**Stack**: React 18, TypeScript, Vite, Tailwind CSS, i18next, Lucide React

## What's Implemented

- Login/session management via Supabase
- Game lobby — create or join rooms
- Real-time game screen with WebSocket communication
- Internationalization (i18next) with multi-language support
- Session persistence and recovery across page reloads
- Responsive UI with Tailwind CSS dark gradient theme

## Quick Start

```bash
npm install
npm run dev        # Dev server (defaults to http://localhost:5173)
```

Requires the backend running at `VITE_API_URL` (defaults to http://localhost:3000).

### Build & run with Docker

```bash
npm run build
docker build -t impostor-frontend .
docker run -p 3000:3000 impostor-frontend
```

## What I Learned

- WebSocket lifecycle management in the browser (connection, reconnection, message routing)
- React state patterns for real-time multiplayer games (useReducer + context)
- Docker multi-stage builds for a Vite + static-serve frontend
- i18next setup with browser language detection
- Session recovery flows — persisting game state across page reloads

## Architecture Overview

State lives in a single `GameContext` with a `useReducer` pattern. API calls go through a typed
service layer (`src/services/`). WebSocket traffic routes through a dedicated service + React hook
(`src/websocket/`). Routing is screen-based (no router library) — `App.tsx` switches between
Login, Lobby, and GameScreen based on context state.
