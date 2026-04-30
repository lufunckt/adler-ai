export type EvolutionPoint = {
  adherence: number;
  anxiety: number;
  expectedPath: number;
  mood: number;
  session: number;
};

export const EVOLUTION_DATA: EvolutionPoint[] = [
  { session: 1, anxiety: 86, mood: 42, adherence: 92, expectedPath: 46 },
  { session: 2, anxiety: 84, mood: 46, adherence: 93, expectedPath: 48 },
  { session: 3, anxiety: 81, mood: 44, adherence: 94, expectedPath: 50 },
  { session: 4, anxiety: 79, mood: 49, adherence: 93, expectedPath: 52 },
  { session: 5, anxiety: 77, mood: 52, adherence: 94, expectedPath: 54 },
  { session: 6, anxiety: 73, mood: 56, adherence: 95, expectedPath: 56 },
  { session: 7, anxiety: 69, mood: 54, adherence: 95, expectedPath: 58 },
  { session: 8, anxiety: 66, mood: 59, adherence: 96, expectedPath: 60 },
  { session: 9, anxiety: 62, mood: 63, adherence: 96, expectedPath: 62 },
  { session: 10, anxiety: 58, mood: 61, adherence: 97, expectedPath: 64 },
  { session: 11, anxiety: 54, mood: 66, adherence: 97, expectedPath: 66 },
  { session: 12, anxiety: 50, mood: 69, adherence: 96, expectedPath: 68 },
  { session: 13, anxiety: 47, mood: 67, adherence: 97, expectedPath: 69 },
  { session: 14, anxiety: 43, mood: 72, adherence: 98, expectedPath: 71 },
  { session: 15, anxiety: 40, mood: 75, adherence: 98, expectedPath: 73 },
  { session: 16, anxiety: 37, mood: 77, adherence: 99, expectedPath: 75 },
  { session: 17, anxiety: 34, mood: 79, adherence: 99, expectedPath: 76 },
  { session: 18, anxiety: 31, mood: 82, adherence: 99, expectedPath: 78 }
];

export function getEvolutionPoint(session: number) {
  return EVOLUTION_DATA.find((point) => point.session === session) ?? EVOLUTION_DATA[EVOLUTION_DATA.length - 1];
}

export function getRecoveryIndex(point: EvolutionPoint) {
  return Math.round(((100 - point.anxiety) + point.mood + point.adherence) / 3);
}

export function getExpectedPathDelta(session: number) {
  const point = getEvolutionPoint(session);

  return getRecoveryIndex(point) - point.expectedPath;
}
