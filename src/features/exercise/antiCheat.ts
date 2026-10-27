import type { AntiCheatChallengeId } from '../../types/lockfit';

export type AntiCheatChallenge = {
  id: AntiCheatChallengeId;
  title: string;
  subtitle: string;
};

export const antiCheatChallenges: AntiCheatChallenge[] = [
  {
    id: 'wave-hand',
    title: 'Помаши рукой',
    subtitle: 'Сделай короткое движение рукой слева направо перед началом упражнения.',
  },
  {
    id: 'touch-shoulder',
    title: 'Коснись плеча',
    subtitle: 'Одной рукой коснись противоположного плеча, затем вернись в исходное положение.',
  },
];

export function pickRandomChallenge(): AntiCheatChallenge {
  return antiCheatChallenges[Math.floor(Math.random() * antiCheatChallenges.length)]!;
}
