export type GameState = 'waiting' | 'playing' | 'voting' | 'won' | 'lost';
export type UserRole = 'player' | 'impostor';

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
