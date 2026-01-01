import { useEffect, useRef, useCallback, useState } from 'react';
import { wsService } from './wsService';
import type {
  WebSocketEventType,
  WebSocketEventPayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserReadyPayload,
  CategorySetPayload,
  GameStartedPayload,
  UserVotedPayload,
  UserEliminatedPayload,
  GameEndPayload,
  RoomUpdatePayload,
} from '../types';

interface UseWebSocketOptions {
  userId: string;
  roomId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onUserJoined?: (payload: UserJoinedPayload) => void;
  onUserLeft?: (payload: UserLeftPayload) => void;
  onUserReady?: (payload: UserReadyPayload) => void;
  onCategorySet?: (payload: CategorySetPayload) => void;
  onGameStarted?: (payload: GameStartedPayload) => void;
  onUserVoted?: (payload: UserVotedPayload) => void;
  onUserEliminated?: (payload: UserEliminatedPayload) => void;
  onGameWon?: (payload: GameEndPayload) => void;
  onGameLost?: (payload: GameEndPayload) => void;
  onRoomUpdate?: (payload: RoomUpdatePayload) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

type EventHandlerMap = {
  user_joined: (payload: UserJoinedPayload) => void;
  user_left: (payload: UserLeftPayload) => void;
  user_ready: (payload: UserReadyPayload) => void;
  category_set: (payload: CategorySetPayload) => void;
  game_started: (payload: GameStartedPayload) => void;
  user_voted: (payload: UserVotedPayload) => void;
  user_eliminated: (payload: UserEliminatedPayload) => void;
  game_won: (payload: GameEndPayload) => void;
  game_lost: (payload: GameEndPayload) => void;
  room_update: (payload: RoomUpdatePayload) => void;
};

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(wsService.isConnected);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    wsService.connect(optionsRef.current.userId, optionsRef.current.roomId);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  useEffect(() => {
    const unsubConnect = wsService.onConnect(() => {
      setIsConnected(true);
      optionsRef.current.onConnect?.();
    });

    const unsubDisconnect = wsService.onDisconnect(() => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  useEffect(() => {
    const eventHandlers: Partial<EventHandlerMap> = {
      user_joined: options.onUserJoined,
      user_left: options.onUserLeft,
      user_ready: options.onUserReady,
      category_set: options.onCategorySet,
      game_started: options.onGameStarted,
      user_voted: options.onUserVoted,
      user_eliminated: options.onUserEliminated,
      game_won: options.onGameWon,
      game_lost: options.onGameLost,
      room_update: options.onRoomUpdate,
    };

    const unsubscribers: Array<() => void> = [];

    for (const [eventType, handler] of Object.entries(eventHandlers)) {
      if (handler) {
        const unsub = wsService.on<WebSocketEventPayload>(
          eventType as WebSocketEventType,
          handler as (payload: WebSocketEventPayload) => void
        );
        unsubscribers.push(unsub);
      }
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    options.onUserJoined,
    options.onUserLeft,
    options.onUserReady,
    options.onCategorySet,
    options.onGameStarted,
    options.onUserVoted,
    options.onUserEliminated,
    options.onGameWon,
    options.onGameLost,
    options.onRoomUpdate,
  ]);

  useEffect(() => {
    if (options.userId && options.roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.userId, options.roomId, connect, disconnect]);

  return { isConnected, connect, disconnect };
}
