import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '../context';
import { userService, roomService } from '../services';
import { UserCircle2, Plus, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useGame();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleSetUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError(t('login.errorUsername'));
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
      setError(err instanceof Error ? err.message : t('login.errorDefault'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!state.currentUser) {
      setError(t('login.errorUserFirst'));
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
      setError(err instanceof Error ? err.message : t('login.errorDefault'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!state.currentUser) {
      setError(t('login.errorUserFirst'));
      return;
    }

    const code = roomCode.trim();
    if (!code) {
      setError(t('login.errorRoomCode'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const room = await roomService.get(code);

      if (!room.is_active) {
        setError(t('login.errorRoomInactive'));
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
      const message = err instanceof Error ? err.message : t('login.errorDefault');
      setError(message.includes('not found') ? t('login.errorRoomNotFound') : message);
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
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition text-xl shadow-sm border border-gray-100"
          title={i18n.language.startsWith('en') ? 'Switch to Spanish' : 'Cambiar a Inglés'}
        >
          {i18n.language.startsWith('en') ? '🇬🇧' : '🇪🇸'}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <UserCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('login.title')}</h1>
          <p className="text-gray-600">{t('login.subtitle')}</p>
        </div>

        {!state.currentUser ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.usernameLabel')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleSetUsername)}
                placeholder={t('login.usernamePlaceholder')}
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
                  {t('login.creating')}
                </>
              ) : (
                t('login.continue')
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">{t('login.welcome')}</p>
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
                {t('login.createRoom')}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('login.or')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('login.roomCodeLabel')}
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleJoinRoom)}
                  placeholder={t('login.roomCodePlaceholder')}
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
                {t('login.joinRoom')}
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
