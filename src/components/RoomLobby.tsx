import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '../context';
import { userService, gameService, roomService, wordService } from '../services';
import { Users, Crown, Check, X, Copy, LogOut, Loader2, Wifi, WifiOff, UserX } from 'lucide-react';
import {
  GameStartedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserReadyPayload,
  CategorySetPayload,
  UserDisconnectedPayload,
  UserReconnectedPayload,
  UserKickedPayload,
} from '../types/webSocket';
import { useWebSocket } from '../websocket/useWebSocket';

export default function RoomLobby() {
  const { t } = useTranslation();
  const { state, dispatch } = useGame();
  const room = state.currentRoom;
  const currentUser = state.currentUser;
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [disconnectedCountdowns, setDisconnectedCountdowns] = useState<Record<string, number>>({});
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
  const countdownIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await wordService.getCategories();
        setCategories(cats);
        if (room?.category) {
          setSelectedCategory(room.category);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, [room?.category]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    const intervals = countdownIntervalsRef.current;
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);

  const clearCountdown = useCallback((userId: string) => {
    if (countdownIntervalsRef.current[userId]) {
      clearInterval(countdownIntervalsRef.current[userId]);
      delete countdownIntervalsRef.current[userId];
    }
    setDisconnectedCountdowns((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const handleUserJoined = useCallback(
    (payload: UserJoinedPayload) => {
      dispatch({
        type: 'ADD_PLAYER',
        player: {
          id: payload.user_id,
          username: payload.nickname,
          isReady: false,
          isImpostor: false,
          isAlive: true,
          votedFor: null,
        },
      });
    },
    [dispatch],
  );

  const handleUserLeft = useCallback(
    (payload: UserLeftPayload) => {
      dispatch({ type: 'REMOVE_PLAYER', playerId: payload.user_id });
    },
    [dispatch],
  );

  const handleUserReady = useCallback(
    (payload: UserReadyPayload) => {
      dispatch({
        type: 'UPDATE_PLAYER',
        playerId: payload.user_id,
        updates: { isReady: payload.is_ready },
      });
    },
    [dispatch],
  );

  const handleCategorySet = useCallback(
    (payload: CategorySetPayload) => {
      setSelectedCategory(payload.category);
      dispatch({
        type: 'SET_CATEGORY',
        category: payload.category,
      });
    },
    [dispatch],
  );

  const handleGameStarted = useCallback(
    (payload: GameStartedPayload) => {
      const isImpostor = currentUser?.id === payload.impostor_id;
      const word = isImpostor ? null : (payload.current_word ?? null);

      dispatch({
        type: 'START_GAME',
        gameId: payload.game_id,
        impostorId: payload.impostor_id,
        word,
      });
    },
    [dispatch, currentUser?.id],
  );

  const handleUserKicked = useCallback(
    (payload: UserKickedPayload) => {
      if (payload.user_id === currentUser?.id) {
        const msg = payload.reason === 'kicked' ? t('lobby.kicked') : t('lobby.disconnectedKick');
        setKickedMessage(msg);
        setTimeout(() => {
          dispatch({ type: 'LEAVE_ROOM' });
        }, 2000);
      } else {
        clearCountdown(payload.user_id);
        dispatch({ type: 'REMOVE_PLAYER', playerId: payload.user_id });
      }
    },
    [currentUser?.id, dispatch, clearCountdown, t],
  );

  const handleUserDisconnected = useCallback((payload: UserDisconnectedPayload) => {
    // Clear any existing interval for this user
    if (countdownIntervalsRef.current[payload.user_id]) {
      clearInterval(countdownIntervalsRef.current[payload.user_id]);
    }

    setDisconnectedCountdowns((prev) => ({
      ...prev,
      [payload.user_id]: payload.timeout_seconds,
    }));

    const interval = setInterval(() => {
      setDisconnectedCountdowns((prev) => {
        const current = prev[payload.user_id];
        if (current === undefined || current <= 1) {
          clearInterval(countdownIntervalsRef.current[payload.user_id]);
          delete countdownIntervalsRef.current[payload.user_id];
          const next = { ...prev };
          delete next[payload.user_id];
          return next;
        }
        return { ...prev, [payload.user_id]: current - 1 };
      });
    }, 1000);

    countdownIntervalsRef.current[payload.user_id] = interval;
  }, []);

  const handleUserReconnected = useCallback(
    (payload: UserReconnectedPayload) => {
      clearCountdown(payload.user_id);
      dispatch({
        type: 'UPDATE_PLAYER',
        playerId: payload.user_id,
        updates: { isReady: false },
      });
    },
    [clearCountdown, dispatch],
  );

  const handleKickPlayer = useCallback(
    async (playerId: string) => {
      if (!room || !currentUser) return;
      try {
        await roomService.kickUser(room.code, playerId, currentUser.id);
      } catch (err) {
        console.error('Failed to kick player:', err);
      }
    },
    [room, currentUser],
  );

  const userId = currentUser?.id;
  const roomId = room?.code;

  const { isConnected } = useWebSocket(
    userId && roomId
      ? {
          userId,
          roomId,
          onUserJoined: handleUserJoined,
          onUserLeft: handleUserLeft,
          onUserReady: handleUserReady,
          onCategorySet: handleCategorySet,
          onGameStarted: handleGameStarted,
          onUserKicked: handleUserKicked,
          onUserDisconnected: handleUserDisconnected,
          onUserReconnected: handleUserReconnected,
        }
      : {
          userId: '',
          roomId: '',
        },
  );

  const handleToggleReady = async () => {
    if (!currentUser) return;

    try {
      await userService.toggleReady(currentUser.id);
    } catch (err) {
      console.error('Failed to toggle ready:', err);
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (!room || !currentUser) return;

    try {
      await roomService.setCategory(room.code, {
        category,
        leader_id: currentUser.id,
      });
      setSelectedCategory(category);
    } catch (err) {
      console.error('Failed to set category:', err);
    }
  };

  const handleStartGame = async () => {
    if (!room) return;

    try {
      await gameService.start({ room_id: room.code });
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentUser) return;

    try {
      await userService.delete(currentUser.id);
    } catch (err) {
      console.error('error deleting user: ', err);
    } finally {
      dispatch({ type: 'LEAVE_ROOM' });
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
  };

  if (!room || !currentUser) return null;

  if (kickedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-gray-800">{kickedMessage}</p>
        </div>
      </div>
    );
  }

  const allReady = room.players.length >= 3 && room.players.every((p) => p.isReady);
  const isHost = currentUser.id === room.hostId;
  const canStart = allReady && isHost && selectedCategory !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t('lobby.title')}</h1>
                <p className="text-sm text-gray-600">
                  {t('lobby.players', { count: room.players.length })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${isConnected ? 'text-green-600' : 'text-red-600'}`}
                title={isConnected ? t('lobby.connected') : t('lobby.disconnected')}
              >
                {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <button
                onClick={handleLeaveRoom}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('lobby.roomCode')}</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 tracking-wider break-all">
                  {room.code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-white hover:bg-blue-100 rounded-lg transition shadow-sm"
              >
                <Copy className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>

          {isHost && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('lobby.category')}</h2>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : (
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={!isConnected}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{t('lobby.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!isHost && selectedCategory && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">{t('lobby.category')}</p>
              <p className="text-lg font-semibold text-blue-600">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('lobby.players_title')}</h2>
            <div className="space-y-2">
              {room.players.map((player) => {
                const countdown = disconnectedCountdowns[player.id];
                const isDisconnected = countdown !== undefined;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                      isDisconnected
                        ? 'bg-amber-50 border-amber-300'
                        : player.isReady
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                          isDisconnected
                            ? 'bg-amber-400'
                            : player.isReady
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                        }`}
                      >
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{player.username}</span>
                        {player.id === room.hostId && <Crown className="w-4 h-4 text-yellow-500" />}
                        {player.id === currentUser.id && (
                          <span className="text-xs text-gray-500">{t('lobby.you')}</span>
                        )}
                        {isDisconnected && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            ⏱ {t('lobby.disconnecting', { count: countdown })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isDisconnected &&
                        (player.isReady ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Check className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('lobby.ready')}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <X className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('lobby.notReady')}</span>
                          </span>
                        ))}
                      {isHost && player.id !== currentUser.id && (
                        <button
                          onClick={() => handleKickPlayer(player.id)}
                          title={t('lobby.kickPlayer')}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {room.players.length < 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center">{t('lobby.minPlayers')}</p>
            </div>
          )}

          {!selectedCategory && room.players.length >= 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center">
                {isHost ? t('lobby.hostSelectCategory') : t('lobby.waitingHostCategory')}
              </p>
            </div>
          )}

          {!isConnected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('lobby.connecting')}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleToggleReady}
              disabled={!isConnected}
              className={`w-full py-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                currentUser.isReady
                  ? 'bg-gray-400 hover:bg-gray-500 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {currentUser.isReady ? t('lobby.cancelReady') : t('lobby.imReady')}
            </button>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart || !isConnected}
                className={`w-full py-4 rounded-lg font-semibold transition shadow-md ${
                  canStart && isConnected
                    ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!selectedCategory
                  ? t('lobby.selectCategoryFirst')
                  : allReady
                    ? t('lobby.startGame')
                    : t('lobby.waitingPlayers')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
