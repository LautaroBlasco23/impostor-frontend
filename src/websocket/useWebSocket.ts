import { useEffect, useRef, useCallback, useState } from 'react';
import { wsService } from './wsService';
import type {
  WebSocketEventType,
  UserJoinedPayload,
  UserLeftPayload,
  UserReadyPayload,
  CategorySetPayload,
  GameStartedPayload,
  UserVotedPayload,
  UserEliminatedPayload,
  GameEndPayload,
  RoomUpdatePayload,
} from '../types/webSocket';

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

const EVENT_TYPES = [
  'user_joined',
  'user_left',
  'user_ready',
  'category_set',
  'game_started',
  'user_voted',
  'user_eliminated',
  'game_won',
  'game_lost',
  'room_update',
] as const;

type EventType = typeof EVENT_TYPES[number];

const EVENT_TO_HANDLER: Record<EventType, keyof UseWebSocketOptions> = {
  user_joined: 'onUserJoined',
  user_left: 'onUserLeft',
  user_ready: 'onUserReady',
  category_set: 'onCategorySet',
  game_started: 'onGameStarted',
  user_voted: 'onUserVoted',
  user_eliminated: 'onUserEliminated',
  game_won: 'onGameWon',
  game_lost: 'onGameLost',
  room_update: 'onRoomUpdate',
};

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(() => wsService.isConnected);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    wsService.connect(optionsRef.current.userId, optionsRef.current.roomId);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  useEffect(() => {
    // Sync state immediately in case we missed the connect event
    setIsConnected(wsService.isConnected);

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
    const unsubscribers = EVENT_TYPES.map((eventType) => {
      return wsService.on(eventType as WebSocketEventType, (payload: unknown) => {
        const handlerKey = EVENT_TO_HANDLER[eventType];
        const handler = optionsRef.current[handlerKey] as ((p: unknown) => void) | undefined;
        handler?.(payload);
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

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
