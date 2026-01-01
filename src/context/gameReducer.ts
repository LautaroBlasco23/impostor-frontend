import type { GameState, GameAction } from './types';

export const initialState: GameState = {
  currentUser: null,
  currentRoom: null,
  gameId: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.user };

    case 'SET_ROOM':
      return { ...state, currentRoom: action.room };

    case 'SET_GAME_ID':
      return { ...state, gameId: action.gameId };

    case 'LEAVE_ROOM':
      return { currentUser: null, currentRoom: null, gameId: null };

    case 'ADD_PLAYER': {
      if (!state.currentRoom) return state;
      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          players: [...state.currentRoom.players, action.player],
        },
      };
    }

    case 'REMOVE_PLAYER': {
      if (!state.currentRoom) return state;
      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          players: state.currentRoom.players.filter((p) => p.id !== action.playerId),
        },
      };
    }

    case 'UPDATE_PLAYER': {
      if (!state.currentRoom) return state;

      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === action.playerId ? { ...p, ...action.updates } : p
      );

      const updatedCurrentUser =
        state.currentUser?.id === action.playerId
          ? { ...state.currentUser, ...action.updates }
          : state.currentUser;

      return {
        ...state,
        currentUser: updatedCurrentUser,
        currentRoom: { ...state.currentRoom, players: updatedPlayers },
      };
    }

    case 'START_GAME': {
      if (!state.currentRoom || !state.currentUser) return state;

      const isCurrentUserImpostor = action.impostorId === state.currentUser.id;

      const updatedPlayers = state.currentRoom.players.map((p) => ({
        ...p,
        isImpostor: p.id === action.impostorId,
        isAlive: true,
        votedFor: null,
      }));

      return {
        ...state,
        gameId: action.gameId,
        currentUser: {
          ...state.currentUser,
          isImpostor: isCurrentUserImpostor,
          isAlive: true,
          votedFor: null,
        },
        currentRoom: {
          ...state.currentRoom,
          status: 'playing',
          currentWord: action.word,
          round: 1,
          players: updatedPlayers,
        },
      };
    }

    case 'ELIMINATE_PLAYER': {
      if (!state.currentRoom) return state;

      const updatedPlayers = state.currentRoom.players.map((p) =>
        p.id === action.playerId ? { ...p, isAlive: false } : { ...p, votedFor: null }
      );

      const updatedCurrentUser =
        state.currentUser?.id === action.playerId
          ? { ...state.currentUser, isAlive: false }
          : state.currentUser
            ? { ...state.currentUser, votedFor: null }
            : null;

      return {
        ...state,
        currentUser: updatedCurrentUser,
        currentRoom: {
          ...state.currentRoom,
          round: state.currentRoom.round + 1,
          players: updatedPlayers,
        },
      };
    }

    case 'END_GAME': {
      if (!state.currentRoom) return state;

      const updatedPlayers = state.currentRoom.players.map((p) => ({
        ...p,
        isImpostor: p.id === action.impostorId,
      }));

      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          status: 'finished',
          currentWord: action.word,
          players: updatedPlayers,
        },
      };
    }

    default:
      return state;
  }
}
