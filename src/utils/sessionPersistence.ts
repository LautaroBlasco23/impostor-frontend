interface PersistedSession {
  userId: string;
  roomCode: string;
  timestamp: number;
}

const SESSION_KEY = 'impostor_game_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export const sessionPersistence = {
  save(userId: string, roomCode: string): void {
    const session: PersistedSession = {
      userId,
      roomCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  load(): PersistedSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session: PersistedSession = JSON.parse(raw);
      const isExpired = Date.now() - session.timestamp > SESSION_TTL_MS;
      if (isExpired) {
        this.clear();
        return null;
      }
      return session;
    } catch {
      this.clear();
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  updateTimestamp(): void {
    const session = this.load();
    if (session) {
      this.save(session.userId, session.roomCode);
    }
  },
};
