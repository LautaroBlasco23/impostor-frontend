import type {
  WebSocketEvent,
  WebSocketEventType,
  WebSocketEventPayload,
} from '../types/webSocket';

type EventHandler<T = WebSocketEventPayload> = (payload: T) => void;
type ConnectionHandler = () => void;

interface WebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

class WebSocketService {
  private socket: WebSocket | null = null;
  private userId: string | null = null;
  private roomId: string | null = null;
  private eventHandlers = new Map<WebSocketEventType, Set<EventHandler>>();
  private onConnectHandlers = new Set<ConnectionHandler>();
  private onDisconnectHandlers = new Set<ConnectionHandler>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<WebSocketConfig>;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
    };
  }

  connect(userId: string, roomId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    this.userId = userId;
    this.roomId = roomId;
    this.reconnectAttempts = 0;

    this.establishConnection();
  }

  private establishConnection(): void {
    if (!this.userId || !this.roomId) return;

    const url = `${WS_BASE_URL}/ws/${this.userId}?roomId=${this.roomId}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.onConnectHandlers.forEach((handler) => handler());
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const wsEvent = JSON.parse(event.data) as WebSocketEvent<WebSocketEventPayload>;
        this.dispatchEvent(wsEvent);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    this.socket.onclose = () => {
      this.onDisconnectHandlers.forEach((handler) => handler());
      this.attemptReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.establishConnection();
    }, this.config.reconnectInterval);
  }

  private dispatchEvent(event: WebSocketEvent<WebSocketEventPayload>): void {
    const handlers = this.eventHandlers.get(event.type);
    handlers?.forEach((handler) => handler(event.payload));
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = this.config.maxReconnectAttempts;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.userId = null;
    this.roomId = null;
  }

  on<T extends WebSocketEventPayload>(
    eventType: WebSocketEventType,
    handler: EventHandler<T>
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    return () => {
      handlers.delete(handler as EventHandler);
    };
  }

  off(eventType: WebSocketEventType, handler?: EventHandler): void {
    if (handler) {
      this.eventHandlers.get(eventType)?.delete(handler);
    } else {
      this.eventHandlers.delete(eventType);
    }
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.add(handler);
    return () => this.onConnectHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.add(handler);
    return () => this.onDisconnectHandlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }
}

export const wsService = new WebSocketService();
export { WebSocketService };
