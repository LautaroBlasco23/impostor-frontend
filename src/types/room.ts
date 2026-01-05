import type { Player } from './user';

export type RoomStatus = 'waiting' | 'playing' | 'paused' | 'finished' | 'cancelled';

export interface Room {
  id: string;
  name: string;
  leader_id: string;
  max_users: number;
  created_at: string;
  is_active: boolean;
  category?: string;
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
