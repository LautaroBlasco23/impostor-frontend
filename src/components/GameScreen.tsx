import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Eye, EyeOff, Trophy, XCircle, AlertCircle } from 'lucide-react';

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const room = state.currentRoom;
  const currentUser = state.currentUser;
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  if (!room || !currentUser) return null;

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const deadPlayers = room.players.filter((p) => !p.isAlive);
  const allVoted = alivePlayers.every((p) => p.votedFor !== null);
  const hasVoted = currentUser.votedFor !== null;

  const handleVote = () => {
    if (!selectedPlayer || !currentUser.isAlive) return;
    dispatch({ type: 'VOTE', voterId: currentUser.id, targetId: selectedPlayer });
  };

  const handleNextRound = () => {
    dispatch({ type: 'NEXT_ROUND' });
    setSelectedPlayer(null);
  };

  const handleLeaveGame = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  if (room.status === 'finished') {
    const impostors = room.players.filter((p) => p.isImpostor);
    const impostorEliminated = impostors.every((imp) => !imp.isAlive);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                impostorEliminated ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {impostorEliminated ? 'Players Win!' : 'Impostor Wins!'}
              </p>
              <p className="text-gray-600 mb-4">The word was:</p>
              <p className="text-3xl font-bold text-blue-600">{room.currentWord}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">The impostor was:</p>
              {impostors.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <EyeOff className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-600">{imp.username}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleLeaveGame}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Round {room.round}</h1>
              <p className="text-sm text-gray-600">
                {alivePlayers.length} players remaining
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your role</p>
              <div className="flex items-center gap-2 mt-1">
                {currentUser.isImpostor ? (
                  <>
                    <EyeOff className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-600">Impostor</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-600">Player</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 mb-6 text-center">
            {currentUser.isImpostor ? (
              <div>
                <AlertCircle className="w-12 h-12 text-white mx-auto mb-3" />
                <p className="text-white text-lg font-semibold">
                  You are the Impostor!
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  Blend in and avoid being voted out
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white text-sm mb-2">Your word is:</p>
                <p className="text-4xl font-bold text-white">{room.currentWord}</p>
                <p className="text-blue-100 text-sm mt-2">
                  Find who doesn't know this word
                </p>
              </div>
            )}
          </div>

          {currentUser.isAlive ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {hasVoted ? 'Waiting for others to vote...' : 'Vote to Eliminate'}
              </h2>
              <div className="space-y-2 mb-4">
                {alivePlayers
                  .filter((p) => p.id !== currentUser.id)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => !hasVoted && setSelectedPlayer(player.id)}
                      disabled={hasVoted}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        hasVoted && currentUser.votedFor === player.id
                          ? 'bg-red-50 border-red-500'
                          : selectedPlayer === player.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center font-semibold text-white">
                            {player.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {player.username}
                          </span>
                        </div>
                        {player.votedFor && (
                          <span className="text-xs text-gray-500">Voted</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>

              {!hasVoted && (
                <button
                  onClick={handleVote}
                  disabled={!selectedPlayer}
                  className={`w-full py-4 rounded-lg font-semibold transition shadow-md ${
                    selectedPlayer
                      ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Vote
                </button>
              )}

              {allVoted && (
                <button
                  onClick={handleNextRound}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition shadow-md hover:shadow-lg mt-4"
                >
                  See Results
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-700">You were eliminated</p>
              <p className="text-sm text-gray-500 mt-2">
                Waiting for the game to end...
              </p>
            </div>
          )}
        </div>

        {deadPlayers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Eliminated Players</p>
            <div className="flex flex-wrap gap-2">
              {deadPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-600"
                >
                  {player.username}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
