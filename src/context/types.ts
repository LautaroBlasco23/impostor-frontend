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

export interface GameState {
  currentUser: Player | null;
  currentRoom: Room | null;
  gameId: string | null;
}

export type GameAction =
  | { type: 'SET_USER'; user: Player }
  | { type: 'SET_ROOM'; room: Room }
  | { type: 'SET_GAME_ID'; gameId: string }
  | { type: 'LEAVE_ROOM' }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'UPDATE_PLAYER'; playerId: string; updates: Partial<Player> }
  | { type: 'START_GAME'; word: string | null; impostorId: string; gameId: string }
  | { type: 'ELIMINATE_PLAYER'; playerId: string; wasImpostor: boolean }
  | { type: 'END_GAME'; winner: 'players' | 'impostor'; word: string; impostorId: string };
