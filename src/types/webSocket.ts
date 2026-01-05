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
  | 'room_update'
  | 'user_disconnected'
  | 'user_reconnected'
  | 'game_cancelled';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  room_id: string;
  payload: T;
}

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
  state?: string;
  vote_count?: Record<string, number>;
  voted_users?: Record<string, string>;
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
  round_number?: number;
  message?: string;
  users?: Array<{
    id: string;
    nickname: string;
    is_ready: boolean;
    is_alive: boolean;
  }>;
}

export interface UserDisconnectedPayload {
  user_id: string;
  nickname: string;
  timeout_seconds: number;
  disconnect_at: string;
  previous_state: string;
}

export interface UserReconnectedPayload {
  user_id: string;
  nickname: string;
  game_state: string;
}

export interface GameCancelledPayload {
  game_id: string;
  reason: string;
  impostor_id: string;
  word: string;
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
  | RoomUpdatePayload
  | UserDisconnectedPayload
  | UserReconnectedPayload
  | GameCancelledPayload;

export type ClientMessageType = 'reconnect';

export interface ClientMessage<T = unknown> {
  type: ClientMessageType;
  payload: T;
}

export interface ReconnectPayload {
  game_id: string;
}
