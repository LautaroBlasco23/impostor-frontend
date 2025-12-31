export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isImpostor: boolean;
  isAlive: boolean;
  votedFor: string | null;
}

export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  currentWord: string | null;
  round: number;
}

export type GameState = {
  currentUser: Player | null;
  currentRoom: Room | null;
  rooms: Map<string, Room>;
};

export type GameAction =
  | { type: 'SET_USERNAME'; username: string }
  | { type: 'CREATE_ROOM'; roomCode: string; userId: string }
  | { type: 'JOIN_ROOM'; roomCode: string; userId: string; username: string }
  | { type: 'LEAVE_ROOM' }
  | { type: 'TOGGLE_READY'; userId: string }
  | { type: 'START_GAME' }
  | { type: 'VOTE'; voterId: string; targetId: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_GAME' };
