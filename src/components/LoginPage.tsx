import { useState } from 'react';
import { useGame } from '../context';
import { userService, roomService } from '../services';
import { UserCircle2, Plus, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { state, dispatch } = useGame();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await userService.create({ nickname: trimmed });
      dispatch({
        type: 'SET_USER',
        user: {
          id: user.id,
          username: user.nickname,
          isReady: user.is_ready,
          isImpostor: user.role === 'impostor',
          isAlive: user.is_alive,
          votedFor: null,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!state.currentUser) {
      setError('Please set your username first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const room = await roomService.create({
        name: `${state.currentUser.username}'s Room`,
        max_users: 10,
        leader_id: state.currentUser.id,
      });

      await userService.joinRoom(state.currentUser.id, { room_id: room.id });

      dispatch({
        type: 'SET_ROOM',
        room: {
          code: room.id,
          players: [state.currentUser],
          hostId: room.leader_id,
          status: 'waiting',
          currentWord: null,
          round: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!state.currentUser) {
      setError('Please set your username first');
      return;
    }

    const code = roomCode.trim();
    if (!code) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const room = await roomService.get(code);

      if (!room.is_active) {
        setError('This room is no longer active');
        setIsLoading(false);
        return;
      }

      await userService.joinRoom(state.currentUser.id, { room_id: room.id });
      const users = await userService.getByRoom(room.id);

      dispatch({
        type: 'SET_ROOM',
        room: {
          code: room.id,
          players: users.map((u) => ({
            id: u.id,
            username: u.nickname,
            isReady: u.is_ready,
            isImpostor: u.role === 'impostor',
            isAlive: u.is_alive,
            votedFor: null,
          })),
          hostId: room.leader_id,
          status: 'waiting',
          currentWord: null,
          round: 0,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message.includes('not found') ? 'Room not found' : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !isLoading) {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <UserCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Word Detective</h1>
          <p className="text-gray-600">Find the impostor among you</p>
        </div>

        {!state.currentUser ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleSetUsername)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSetUsername}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="text-xl font-bold text-gray-800">{state.currentUser.username}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Create New Room
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleJoinRoom)}
                  placeholder="Enter room code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  maxLength={36}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                Join Room
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
