import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { generateRoomCode } from '../utils/gameUtils';
import { UserCircle2, Plus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { state, dispatch } = useGame();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleSetUsername = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    dispatch({ type: 'SET_USERNAME', username: username.trim() });
    setError('');
  };

  const handleCreateRoom = () => {
    if (!state.currentUser) {
      setError('Please set your username first');
      return;
    }
    const code = generateRoomCode();
    dispatch({ type: 'CREATE_ROOM', roomCode: code, userId: state.currentUser.id });
  };

  const handleJoinRoom = () => {
    if (!state.currentUser) {
      setError('Please set your username first');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    const room = state.rooms.get(roomCode.toUpperCase());
    if (!room) {
      setError('Room not found');
      return;
    }
    if (room.status !== 'waiting') {
      setError('This room is already in progress');
      return;
    }

    dispatch({
      type: 'JOIN_ROOM',
      roomCode: roomCode.toUpperCase(),
      userId: state.currentUser.id,
      username: state.currentUser.username,
    });
    setError('');
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
                onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                maxLength={20}
              />
            </div>
            <button
              onClick={handleSetUsername}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Continue
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
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Room
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
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
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                  placeholder="Enter room code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
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
