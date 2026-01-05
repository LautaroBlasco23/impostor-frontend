import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/gameContext';
import { sessionPersistence } from '../utils/sessionPersistence';
import { roomService, userService, gameService } from '../services';
import type { Player, User } from '../types/user';
import type { RoomState, RoomStatus, Room } from '../types/room';
import { Game } from '../types/game';

interface RecoveryState {
  isRecovering: boolean;
  error: string | null;
}

function mapUserToPlayer(user: User): Player {
  return {
    id: user.id,
    username: user.nickname,
    isReady: user.is_ready,
    isImpostor: user.role === 'impostor',
    isAlive: user.is_alive,
    votedFor: null,
  };
}

function gameStateToRoomStatus(gameState: Game['state'] | null): RoomStatus {
  if (!gameState) return 'waiting';
  switch (gameState) {
    case 'playing':
    case 'voting':
      return 'playing';
    case 'won':
    case 'lost':
      return 'finished';
    default:
      return 'waiting';
  }
}

function mapToRoomState(room: Room, players: Player[], game: Game | null): RoomState {
  return {
    code: room.id,
    hostId: room.leader_id,
    category: room.category ?? '',
    players,
    status: gameStateToRoomStatus(game?.state ?? null),
    currentWord: null,
    round: game?.round_number ?? 1,
  };
}

export function useSessionRecovery(): RecoveryState {
  const { state, dispatch } = useGame();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    error: null,
  });
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (state.currentRoom || state.currentUser) return;

    const session = sessionPersistence.load();
    if (!session) return;

    attemptedRef.current = true;
    setRecoveryState({ isRecovering: true, error: null });

    const recover = async () => {
      try {
        const [apiUser, apiRoom, roomUsers] = await Promise.all([
          userService.get(session.userId),
          roomService.get(session.roomCode),
          userService.getByRoom(session.roomCode),
        ]);

        const playerInRoom = roomUsers.some((u: User) => u.id === session.userId);
        if (!playerInRoom) {
          sessionPersistence.clear();
          setRecoveryState({ isRecovering: false, error: 'No longer in room' });
          return;
        }

        const players = roomUsers.map(mapUserToPlayer);
        const user = mapUserToPlayer(apiUser);

        const game = await gameService.getByRoom(session.roomCode);

        const room = mapToRoomState(apiRoom, players, game);

        if (game && (game.state === 'playing' || game.state === 'voting')) {
          const isImpostor = user.id === game.impostor_id;
          dispatch({
            type: 'RESTORE_GAME_SESSION',
            user: { ...user, isImpostor },
            room,
            gameId: game.id,
            word: isImpostor ? null : (game.current_word ?? null),
            impostorId: game.impostor_id,
          });
        } else {
          dispatch({ type: 'RESTORE_SESSION', user, room });
        }

        sessionPersistence.updateTimestamp();
        setRecoveryState({ isRecovering: false, error: null });
      } catch {
        sessionPersistence.clear();
        setRecoveryState({ isRecovering: false, error: 'Recovery failed' });
      }
    };

    recover();
  }, [dispatch, state.currentRoom, state.currentUser]);

  useEffect(() => {
    if (state.currentUser?.id && state.currentRoom?.code) {
      sessionPersistence.save(state.currentUser.id, state.currentRoom.code);
    }
  }, [state.currentUser?.id, state.currentRoom?.code]);

  return recoveryState;
}
