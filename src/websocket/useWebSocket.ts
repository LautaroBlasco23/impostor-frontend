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
  UserDisconnectedPayload,
  UserReconnectedPayload,
  GameCancelledPayload,
  ClientMessage,
} from '../types/webSocket';

interface UseWebSocketOptions {
  userId: string;
  roomId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onUserJoined?: (p: UserJoinedPayload) => void;
  onUserLeft?: (p: UserLeftPayload) => void;
  onUserReady?: (p: UserReadyPayload) => void;
  onCategorySet?: (p: CategorySetPayload) => void;
  onGameStarted?: (p: GameStartedPayload) => void;
  onUserVoted?: (p: UserVotedPayload) => void;
  onUserEliminated?: (p: UserEliminatedPayload) => void;
  onGameWon?: (p: GameEndPayload) => void;
  onGameLost?: (p: GameEndPayload) => void;
  onRoomUpdate?: (p: RoomUpdatePayload) => void;
  onUserDisconnected?: (p: UserDisconnectedPayload) => void;
  onUserReconnected?: (p: UserReconnectedPayload) => void;
  onGameCancelled?: (p: GameCancelledPayload) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: <T>(message: ClientMessage<T>) => void;
}

const EVENT_TYPES: WebSocketEventType[] = [
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
  'user_disconnected',
  'user_reconnected',
  'game_cancelled',
];

const EVENT_TO_HANDLER = {
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
  user_disconnected: 'onUserDisconnected',
  user_reconnected: 'onUserReconnected',
  game_cancelled: 'onGameCancelled',
} as const;

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const optionsRef = useRef(options);
  const connectionRef = useRef<{ userId: string; roomId: string } | null>(null);

  optionsRef.current = options;

  const sendMessage = useCallback(<T>(message: ClientMessage<T>) => {
    wsService.send(message);
  }, []);

  useEffect(() => {
    const unsubConnect = wsService.onConnect(() => {
      setIsConnected(true);
      setIsConnecting(false);
      optionsRef.current.onConnect?.();
    });

    const unsubDisconnect = wsService.onDisconnect(() => {
      setIsConnected(false);
      setIsConnecting(false);
      optionsRef.current.onDisconnect?.();
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  useEffect(() => {
    const unsubs = EVENT_TYPES.map((eventType) =>
      wsService.on(eventType, (payload: unknown) => {
        const handlerKey = EVENT_TO_HANDLER[eventType];
        const handler = optionsRef.current[handlerKey] as ((p: unknown) => void) | undefined;
        handler?.(payload);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (!options.userId || !options.roomId) return;

    const prev = connectionRef.current;
    if (prev?.userId === options.userId && prev?.roomId === options.roomId) {
      return;
    }

    connectionRef.current = {
      userId: options.userId,
      roomId: options.roomId,
    };

    setIsConnecting(true);
    wsService.connect(options.userId, options.roomId);

    return () => {
      wsService.disconnect();
      connectionRef.current = null;
      setIsConnecting(false);
    };
  }, [options.userId, options.roomId]);

  return { isConnected, isConnecting, sendMessage };
}
