import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Users, Crown, Check, X, Copy, LogOut } from 'lucide-react';

export default function RoomLobby() {
  const { state, dispatch } = useGame();
  const room = state.currentRoom;
  const currentUser = state.currentUser;

  useEffect(() => {
    if (!room || room.status !== 'waiting') return;

    const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
    if (allReady) {
      const timer = setTimeout(() => {
        dispatch({ type: 'START_GAME' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [room, dispatch]);

  const handleToggleReady = () => {
    if (!currentUser) return;
    dispatch({ type: 'TOGGLE_READY', userId: currentUser.id });
  };

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
    }
  };

  if (!room || !currentUser) return null;

  const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);

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
            <button
              onClick={handleLeaveRoom}
              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Room Code</p>
                <p className="text-3xl font-bold text-blue-600 tracking-wider">{room.code}</p>
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
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                    player.isReady
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                        player.isReady ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{player.username}</span>
                      {player.id === room.hostId && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isReady ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Check className="w-5 h-5" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <X className="w-5 h-5" />
                        Not Ready
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

          {allReady && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 font-medium text-center animate-pulse">
                Starting game...
              </p>
            </div>
          )}

          <button
            onClick={handleToggleReady}
            className={`w-full py-4 rounded-lg font-semibold transition shadow-md hover:shadow-lg ${
              currentUser.isReady
                ? 'bg-gray-400 hover:bg-gray-500 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {currentUser.isReady ? 'Not Ready' : 'Ready'}
          </button>
        </div>
      </div>
    </div>
  );
}
