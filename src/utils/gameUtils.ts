import { Player } from '../types/game';

const WORDS = [
  'Pizza',
  'Ocean',
  'Mountain',
  'Guitar',
  'Sunset',
  'Library',
  'Coffee',
  'Bicycle',
  'Garden',
  'Painting',
  'Telescope',
  'Beach',
  'Forest',
  'Castle',
  'Dragon',
  'Rainbow',
  'Thunder',
  'Waterfall',
  'Butterfly',
  'Volcano',
];

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function selectImpostor(players: Player[]): Player[] {
  if (players.length === 0) return players;

  const impostorIndex = Math.floor(Math.random() * players.length);

  return players.map((player, index) => ({
    ...player,
    isImpostor: index === impostorIndex,
  }));
}
