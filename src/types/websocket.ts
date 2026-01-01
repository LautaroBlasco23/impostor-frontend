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

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  room_id: string;
  payload: T;
}

export interface UserJoinedPayload {
  user_id: string;
  nickname: string;
}

export interface UserLeftPayload {
  user_id: string;
}

export interface UserReadyPayload {
  user_id: string;
  is_ready: boolean;
}

export interface CategorySetPayload {
  category: string;
}

export interface GameStartedPayload {
  game_id: string;
  impostor_id: string;
  current_word: string;
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
