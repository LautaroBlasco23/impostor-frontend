import type { Player } from './user';
import type { RoomState } from './room';

export type GameState = 'waiting' | 'playing' | 'voting' | 'won' | 'lost';

export interface Game {
  id: string;
  room_id: string;
  state: GameState;
  impostor_id?: string;
  current_word?: string;
  category: string;
  vote_count?: Record<string, number>;
  voted_users?: Record<string, string>;
  round_number: number;
  created_at: string;
}

export interface AppGameState {
  currentUser: Player | null;
  currentRoom: RoomState | null;
  gameId: string | null;
}

export interface VoteResult {
  eliminated_user_id: string;
  was_impostor: boolean;
  game_state: GameState;
  message: string;
}

export interface StartGameRequest {
  room_id: string;
}

export interface VoteRequest {
  game_id: string;
  voter_id: string;
  target_id: string;
}

export type GameAction =
  | { type: 'SET_USER'; user: Player }
  | { type: 'SET_ROOM'; room: RoomState }
  | { type: 'SET_GAME_ID'; gameId: string }
  | { type: 'SET_CATEGORY'; category: string }
  | { type: 'LEAVE_ROOM' }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'UPDATE_PLAYER'; playerId: string; updates: Partial<Player> }
  | { type: 'START_GAME'; word: string | null; impostorId: string; gameId: string }
  | { type: 'ELIMINATE_PLAYER'; playerId: string; wasImpostor: boolean }
  | { type: 'END_GAME'; winner: 'players' | 'impostor'; impostorId: string; word: string };
