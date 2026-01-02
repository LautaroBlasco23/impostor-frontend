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

export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isImpostor: boolean;
  isAlive: boolean;
  votedFor: string | null;
}

export interface CreateUserRequest {
  nickname: string;
}
