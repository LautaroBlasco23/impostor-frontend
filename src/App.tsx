import { useGame } from './context/gameContext';
import { useSessionRecovery } from './hooks/useSessionRecovery';
import RoomLobby from './components/RoomLobby';
import GameScreen from './components/GameScreen';
import LoginPage from './components/LoginPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { state } = useGame();
  const { isRecovering } = useSessionRecovery();

  if (isRecovering) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!state.currentRoom) {
    return <LoginPage />;
  }

  if (state.currentRoom.status === 'waiting') {
    return <RoomLobby />;
  }

  return <GameScreen />;
}

export default App;
