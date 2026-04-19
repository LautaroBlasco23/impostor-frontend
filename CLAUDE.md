# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the frontend for **Impostor**, a multiplayer real-time game. It's a React + TypeScript application built with Vite, featuring:

- Real-time multiplayer gameplay via WebSocket
- Game lobby system for creating/joining rooms
- Internationalization (i18next) with multiple language support
- Responsive UI with Tailwind CSS

## Development Commands

### Getting started

```bash
npm install
npm run dev
```

### Build & deployment

```bash
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build locally
```

### Code quality

```bash
npm run lint       # ESLint checks
npm run typecheck  # TypeScript validation
npm run format     # Prettier formatting (writes changes)
npm run prepush    # Runs format, lint, and typecheck (use before committing)
```

## Architecture

### State Management

- **GameContext** (`src/context/gameContext.tsx`): Central state container using React's useReducer pattern
- **GameReducer** (`src/context/gameReducer.ts`): Reducer function handling all game state mutations
- **Types** (`src/types/game.ts`): Game state and action TypeScript definitions

### API Layer

- **Client** (`src/services/client.ts`): Generic HTTP client wrapper around fetch with error handling
- **Service modules** (`src/services/`): Domain-specific API services (user, room, game, word)
  - Each service exports a singleton instance and uses `apiClient` for requests
  - API base URL: `VITE_API_URL` env var (defaults to http://localhost:3000)
  - API prefix: `/api/v1`

### Real-time Communication

- **WebSocket service** (`src/websocket/`):
  - `wsService.ts`: WebSocket connection manager
  - `useWebSocket.ts`: React hook for WebSocket integration
  - Used for live game updates during active gameplay

### UI Structure

- **Pages/Screens** (`src/components/`):
  - `LoginPage.tsx`: User authentication & session setup
  - `RoomLobby.tsx`: Game room creation/joining
  - `GameScreen.tsx`: Active game play area
  - Single-page routing handled in `App.tsx` based on GameContext state
- **Styling**: Tailwind CSS + PostCSS
- **Icons**: Lucide React for UI icons

### Cross-cutting Concerns

- **i18n** (`src/i18n/`): Language detection and translation setup (i18next)
- **Session Persistence** (`src/utils/sessionPersistence.ts`): Local storage for game state
- **Session Recovery** (`src/hooks/useSessionRecovery.ts`): Restores user session on app load

## Type System

All application types are co-located in `src/types/`:

- `game.ts`: Game state, room, player, action types
- `user.ts`: User/authentication types
- `room.ts`: Room management types
- `word.ts`: Game-specific word types
- `api.ts`: API response/error types
- `webSocket.ts`: WebSocket message types

## Key Patterns

### Responsive UI

- Components use Tailwind CSS for responsive design
- Main layout uses gradient backgrounds and centered cards for visual hierarchy

### Error Handling

- API errors are caught in `ApiClientError` (client.ts)
- UI gracefully handles loading states (e.g., session recovery spinner in App.tsx)

### Internationalization

- Current language is sent in `Accept-Language` header for API localization (client.ts:34)
- Frontend translations handled by i18next/react-i18next

## Environment Variables

- `VITE_API_URL`: Backend API URL (defaults to http://localhost:3000)

## Build & Deployment

The Dockerfile uses a multi-stage build:

1. Build stage: Node 20-alpine, runs `npm ci` and `npm run build`
2. Runtime stage: Serves built dist/ with `serve` on port 3000

To run locally with Docker:

```bash
npm run build
docker build -t impostor-frontend .
docker run -p 3000:3000 impostor-frontend
```
