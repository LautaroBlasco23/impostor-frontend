import { useCallback } from 'react';
import { useGame } from '../context';
import { userService, gameService } from '../services';
import { Users, Crown, Check, X, Copy, LogOut, Loader2, Wifi, WifiOff } from 'lucide-react';
import { GameStartedPayload, UserJoinedPayload, UserLeftPayload, UserReadyPayload } from '../types';
import { useWebSocket } from '../websocket/useWebSocket';

export default function RoomLobby() {
  const { state, dispatch } = useGame();
  const room = state.currentRoom;
  const currentUser = state.currentUser;

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
    [dispatch]
  );

  const handleUserLeft = useCallback(
    (payload: UserLeftPayload) => {
      dispatch({ type: 'REMOVE_PLAYER', playerId: payload.user_id });
    },
    [dispatch]
  );

  const handleUserReady = useCallback(
    (payload: UserReadyPayload) => {
      dispatch({
        type: 'UPDATE_PLAYER',
        playerId: payload.user_id,
        updates: { isReady: payload.is_ready },
      });
    },
    [dispatch]
  );

  const handleGameStarted = useCallback(
    (payload: GameStartedPayload) => {
      const isImpostor = payload.impostor_id === currentUser?.id;
      dispatch({
        type: 'START_GAME',
        word: isImpostor ? null : payload.current_word,
        impostorId: payload.impostor_id,
        gameId: payload.game_id,
      });
    },
    [dispatch, currentUser?.id]
  );

  const { isConnected } = useWebSocket({
    userId: currentUser?.id ?? '',
    roomId: room?.code ?? '',
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onUserReady: handleUserReady,
    onGameStarted: handleGameStarted,
  });

  const handleToggleReady = async () => {
    if (!currentUser) return;

    try {
      await userService.toggleReady(currentUser.id);
      dispatch({
        type: 'UPDATE_PLAYER',
        playerId: currentUser.id,
        updates: { isReady: !currentUser.isReady },
      });
    } catch (err) {
      console.error('Failed to toggle ready:', err);
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
    } catch {
      // Continue with local cleanup
    } finally {
      dispatch({ type: 'LEAVE_ROOM' });
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
  };

  if (!room || !currentUser) return null;

  const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
  const isHost = currentUser.id === room.hostId;
  const canStart = allReady && isHost;

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
                <h1 className="text-2xl font-bold text-gray-800">Game Lobby</h1>
                <p className="text-sm text-gray-600">
                  {room.players.length} player{room.players.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${isConnected ? 'text-green-600' : 'text-red-600'}`}
                title={isConnected ? 'Connected' : 'Disconnected'}
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
                <p className="text-sm text-gray-600 mb-1">Room Code</p>
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

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Players</h2>
            <div className="space-y-2">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${player.isReady
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${player.isReady ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{player.username}</span>
                      {player.id === room.hostId && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {player.id === currentUser.id && (
                        <span className="text-xs text-gray-500">(you)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isReady ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <X className="w-5 h-5" />
                        <span className="hidden sm:inline">Not Ready</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {room.players.length < 2 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center">
                Waiting for at least 2 players to start the game
              </p>
            </div>
          )}

          {!isConnected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Reconnecting to server...
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleToggleReady}
              disabled={!isConnected}
              className={`w-full py-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${currentUser.isReady
                ? 'bg-gray-400 hover:bg-gray-500 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
              {currentUser.isReady ? 'Cancel Ready' : "I'm Ready"}
            </button>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart || !isConnected}
                className={`w-full py-4 rounded-lg font-semibold transition shadow-md ${canStart && isConnected
                  ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {allReady ? 'Start Game' : 'Waiting for all players...'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
