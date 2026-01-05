import type { WebSocketEvent, WebSocketEventType } from '../types/webSocket';

type EventCallback = (payload: unknown) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

class WebSocketService {
  private ws: WebSocket | null = null;
  private eventListeners: Map<WebSocketEventType, Set<EventCallback>> = new Map();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingDisconnect: ReturnType<typeof setTimeout> | null = null;
  private currentUserId: string | null = null;
  private currentRoomId: string | null = null;
  private intentionalDisconnect = false;

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(userId: string, roomId: string): void {
    if (!userId || !roomId) {
      return;
    }

    if (this.pendingDisconnect) {
      clearTimeout(this.pendingDisconnect);
      this.pendingDisconnect = null;
    }

    if (
      this.currentUserId === userId &&
      this.currentRoomId === roomId &&
      (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.ws && (this.currentUserId !== userId || this.currentRoomId !== roomId)) {
      this.forceDisconnect();
    }

    this.currentUserId = userId;
    this.currentRoomId = roomId;
    this.intentionalDisconnect = false;

    const nickname = localStorage.getItem('nickname') || 'Anonymous';
    const wsUrl = `${WS_URL}/ws/${userId}?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.connectListeners.forEach((cb) => cb());
    };

    this.ws.onclose = () => {
      this.disconnectListeners.forEach((cb) => cb());
      this.ws = null;

      if (!this.intentionalDisconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        const listeners = this.eventListeners.get(data.type);
        listeners?.forEach((cb) => cb(data.payload));
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (!this.currentUserId || !this.currentRoomId) {
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.currentUserId && this.currentRoomId) {
        this.connect(this.currentUserId, this.currentRoomId);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.pendingDisconnect) {
      return;
    }

    this.pendingDisconnect = setTimeout(() => {
      this.forceDisconnect();
      this.pendingDisconnect = null;
    }, 100);
  }

  private forceDisconnect(): void {
    this.intentionalDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = this.maxReconnectAttempts;
    this.currentUserId = null;
    this.currentRoomId = null;
    this.ws?.close();
    this.ws = null;
  }

  send<T>(message: { type: string; payload: T }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(eventType: WebSocketEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);

    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  onConnect(callback: () => void): () => void {
    this.connectListeners.add(callback);
    return () => {
      this.connectListeners.delete(callback);
    };
  }

  onDisconnect(callback: () => void): () => void {
    this.disconnectListeners.add(callback);
    return () => {
      this.disconnectListeners.delete(callback);
    };
  }
}

export const wsService = new WebSocketService();
