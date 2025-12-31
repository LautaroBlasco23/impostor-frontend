import { useGame } from './context/GameContext';
import LoginPage from './components/LoginPage';
import RoomLobby from './components/RoomLobby';
import GameScreen from './components/GameScreen';

function App() {
  const { state } = useGame();

  if (!state.currentRoom) {
    return <LoginPage />;
  }

  if (state.currentRoom.status === 'waiting') {
    return <RoomLobby />;
  }

  return <GameScreen />;
}

export default App;
