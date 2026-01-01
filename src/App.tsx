import { useGame } from './context/gameContext';
import RoomLobby from './components/RoomLobby';
import GameScreen from './components/GameScreen';
import LoginPage from './components/LoginPage';

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
