// ===== Enums / Unions =====
export type GameState = 'waiting' | 'playing' | 'voting' | 'won' | 'lost';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type UserRole = 'player' | 'impostor';

export type WebSocketEventType =
  | 'user_joined'
  | 'user_left'
  | 'user_ready'
  | 'category_set'
  | 'game_started'
  | 'user_voted'
  | 'user_eliminated'
  | 'game_won'
  | 'game_lost'
  | 'room_update';

// ===== Core App Models =====
export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isImpostor: boolean;
  isAlive: boolean;
  votedFor: string | null;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  status: RoomStatus;
  currentWord: string | null;
  round: number;
  category?: string;
}

export interface AppGameState {
  currentUser: Player | null;
  currentRoom: RoomState | null;
  gameId: string | null;
}

// ===== Backend Domain Models =====
export interface User {
  id: string;
  nickname: string;
  room_id: string;
  role: UserRole;
  is_ready: boolean;
  is_alive: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  leader_id: string;
  max_users: number;
  created_at: string;
  is_active: boolean;
  category?: string;
}

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

export interface Word {
  id: number;
  text: string;
  category: string;
}

// ===== API / DTOs =====
export interface VoteResult {
  eliminated_user_id: string;
  was_impostor: boolean;
  game_state: GameState;
  message: string;
}

export interface CreateUserRequest {
  nickname: string;
}

export interface CreateRoomRequest {
  name: string;
  max_users: number;
  leader_id: string;
}

export interface JoinRoomRequest {
  room_id: string;
}

export interface SetCategoryRequest {
  category: string;
  leader_id: string;
}

export interface StartGameRequest {
  room_id: string;
}

export interface VoteRequest {
  game_id: string;
  voter_id: string;
  target_id: string;
}

export interface CreateWordRequest {
  text: string;
  category: string;
}

export interface ApiError {
  error: string;
}

export interface ApiMessage {
  message: string;
}

// ===== WebSocket Base =====
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  room_id: string;
  payload: T;
}

// ===== WebSocket Payloads =====
export interface UserJoinedPayload {
  user_id: string;
  nickname: string;
  room_id: string;
}

export interface UserLeftPayload {
  user_id: string;
  nickname: string;
}

export interface UserReadyPayload {
  user_id: string;
  nickname: string;
  is_ready: boolean;
}

export interface CategorySetPayload {
  category: string;
  room_id: string;
}

export interface GameStartedPayload {
  game_id: string;
  category: string;
  round_number: number;
  impostor_id: string;
  current_word?: string;
}

export interface UserVotedPayload {
  voter_id: string;
  target_id: string;
}

export interface UserEliminatedPayload {
  user_id: string;
  was_impostor: boolean;
}

export interface GameEndPayload {
  winner: 'players' | 'impostor';
  impostor_id: string;
  word: string;
}

export interface RoomUpdatePayload {
  users: Array<{
    id: string;
    nickname: string;
    is_ready: boolean;
    is_alive: boolean;
  }>;
}

export type WebSocketEventPayload =
  | UserJoinedPayload
  | UserLeftPayload
  | UserReadyPayload
  | CategorySetPayload
  | GameStartedPayload
  | UserVotedPayload
  | UserEliminatedPayload
  | GameEndPayload
  | RoomUpdatePayload;

// ===== Reducer Actions =====
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
