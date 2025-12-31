import { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, Player, Room } from '../types/game';
import { generateRoomCode, getRandomWord, selectImpostor } from '../utils/gameUtils';

const initialState: GameState = {
  currentUser: null,
  currentRoom: null,
  rooms: new Map(),
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USERNAME': {
      const userId = Math.random().toString(36).substring(7);
      return {
        ...state,
        currentUser: {
          id: userId,
          username: action.username,
          isReady: false,
          isImpostor: false,
          isAlive: true,
          votedFor: null,
        },
      };
    }

    case 'CREATE_ROOM': {
      if (!state.currentUser) return state;

      const newRoom: Room = {
        code: action.roomCode,
        players: [{ ...state.currentUser }],
        hostId: action.userId,
        status: 'waiting',
        currentWord: null,
        round: 0,
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(action.roomCode, newRoom);

      return {
        ...state,
        currentRoom: newRoom,
        rooms: newRooms,
      };
    }

    case 'JOIN_ROOM': {
      const room = state.rooms.get(action.roomCode);
      if (!room || room.status !== 'waiting') return state;

      const newPlayer: Player = {
        id: action.userId,
        username: action.username,
        isReady: false,
        isImpostor: false,
        isAlive: true,
        votedFor: null,
      };

      const updatedRoom: Room = {
        ...room,
        players: [...room.players, newPlayer],
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(action.roomCode, updatedRoom);

      return {
        ...state,
        currentUser: newPlayer,
        currentRoom: updatedRoom,
        rooms: newRooms,
      };
    }

    case 'LEAVE_ROOM': {
      return {
        ...state,
        currentRoom: null,
      };
    }

    case 'TOGGLE_READY': {
      if (!state.currentRoom) return state;

      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === action.userId ? { ...p, isReady: !p.isReady } : p
      );

      const updatedRoom: Room = {
        ...state.currentRoom,
        players: updatedPlayers,
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(updatedRoom.code, updatedRoom);

      return {
        ...state,
        currentRoom: updatedRoom,
        rooms: newRooms,
      };
    }

    case 'START_GAME': {
      if (!state.currentRoom) return state;

      const word = getRandomWord();
      const playersWithImpostor = selectImpostor(state.currentRoom.players);

      const updatedRoom: Room = {
        ...state.currentRoom,
        status: 'playing',
        currentWord: word,
        round: 1,
        players: playersWithImpostor.map((p) => ({ ...p, votedFor: null })),
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(updatedRoom.code, updatedRoom);

      const currentUser = playersWithImpostor.find((p) => p.id === state.currentUser?.id);

      return {
        ...state,
        currentRoom: updatedRoom,
        currentUser: currentUser || state.currentUser,
        rooms: newRooms,
      };
    }

    case 'VOTE': {
      if (!state.currentRoom) return state;

      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === action.voterId ? { ...p, votedFor: action.targetId } : p
      );

      const updatedRoom: Room = {
        ...state.currentRoom,
        players: updatedPlayers,
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(updatedRoom.code, updatedRoom);

      return {
        ...state,
        currentRoom: updatedRoom,
        rooms: newRooms,
      };
    }

    case 'NEXT_ROUND': {
      if (!state.currentRoom) return state;

      const voteCounts = new Map<string, number>();
      state.currentRoom.players.forEach((p) => {
        if (p.votedFor && p.isAlive) {
          voteCounts.set(p.votedFor, (voteCounts.get(p.votedFor) || 0) + 1);
        }
      });

      let eliminatedId: string | null = null;
      let maxVotes = 0;
      voteCounts.forEach((votes, playerId) => {
        if (votes > maxVotes) {
          maxVotes = votes;
          eliminatedId = playerId;
        }
      });

      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === eliminatedId
          ? { ...p, isAlive: false, votedFor: null }
          : { ...p, votedFor: null }
      );

      const alivePlayers = updatedPlayers.filter((p) => p.isAlive);
      const aliveImpostors = alivePlayers.filter((p) => p.isImpostor);

      const gameStatus = aliveImpostors.length === 0 ? 'finished' : 'playing';

      const updatedRoom: Room = {
        ...state.currentRoom,
        players: updatedPlayers,
        round: state.currentRoom.round + 1,
        status: gameStatus,
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(updatedRoom.code, updatedRoom);

      return {
        ...state,
        currentRoom: updatedRoom,
        rooms: newRooms,
      };
    }

    case 'END_GAME': {
      if (!state.currentRoom) return state;

      const updatedRoom: Room = {
        ...state.currentRoom,
        status: 'finished',
      };

      const newRooms = new Map(state.rooms);
      newRooms.set(updatedRoom.code, updatedRoom);

      return {
        ...state,
        currentRoom: updatedRoom,
        rooms: newRooms,
      };
    }

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
