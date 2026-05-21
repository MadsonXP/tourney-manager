// ─── Types ───────────────────────────────────────────────────────────────────

export type Player = {
  id: string;
  nick: string;
  pokeId: number;
  totalWins: number;
  totalLosses: number;
  titles: number;
  points: number; // NOVO: Pontuação do ranking da guilda
};

export type MatchResult = "A" | "B" | null;

export type RRResults = {
  [playerId: string]: { [opponentId: string]: "V" | "D" | null };
};

export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  loserId: string | null;
};

export type Tournament = {
  id: string;
  name: string;
  mode: "roundrobin" | "bracket";
  playerIds: string[];
  status: "active" | "finished";
  createdAt: string;
  finishedAt?: string;
  rrResults?: RRResults;
  bracketMatches?: BracketMatch[];
  bracketSize?: number;
  playerSnap?: { id: string; nick: string; pokeId: number }[];
};

export type GuildData = {
  name: string;
  motto: string;
  announcement: string;
};

export type AppState = {
  guild: GuildData;
  players: Player[];
  tournaments: Tournament[];
  activeTournamentId: string | null;
};

// ─── Default State ────────────────────────────────────────────────────────────

const DEFAULT_PLAYERS: Player[] = [
  { id: "p1",  nick: "HunterXP00",   pokeId: 25,  totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p2",  nick: "smaug",        pokeId: 6,   totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p3",  nick: "Kaio10292929", pokeId: 9,   totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p4",  nick: "Rino",         pokeId: 3,   totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p5",  nick: "Alucard",      pokeId: 94,  totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p6",  nick: "Dc_carlos",    pokeId: 133, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p7",  nick: "Kirito_11",    pokeId: 448, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p8",  nick: "Guaxinim",     pokeId: 143, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p9",  nick: "Pesadelo",     pokeId: 196, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p10", nick: "MGoncalves",   pokeId: 197, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
  { id: "p11", nick: "Aípedro",      pokeId: 149, totalWins: 0, totalLosses: 0, titles: 0, points: 0 },
];

export const DEFAULT_STATE: AppState = {
  guild: { name: "Minha Guilda", motto: "⚡ Que o melhor treinador vença!", announcement: "" },
  players: DEFAULT_PLAYERS,
  tournaments: [],
  activeTournamentId: null,
};

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem("tourney_v2_state");
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

export function saveState(state: AppState) {
  try { localStorage.setItem("tourney_v2_state", JSON.stringify(state)); } catch {}
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function generateBracket(playerIds: string[]): BracketMatch[] {
  const size = nextPowerOf2(playerIds.length);
  const rounds = Math.log2(size);
  const matches: BracketMatch[] = [];
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  const slots = new Array(size).fill(null);
  let pIdx = 0;
  for (let i = 0; i < size; i += 2) { if (pIdx < shuffled.length) slots[i] = shuffled[pIdx++]; }
  for (let i = 1; i < size; i += 2) { if (pIdx < shuffled.length) slots[i] = shuffled[pIdx++]; }

  for (let i = 0; i < size / 2; i++) {
    const pA = slots[i * 2];
    const pB = slots[i * 2 + 1];
    const winnerId = pA === null ? pB : pB === null ? pA : null;
    matches.push({ id: `r1-${i}`, round: 1, position: i, playerAId: pA, playerBId: pB, winnerId, loserId: null });
  }

  for (let r = 2; r <= rounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({ id: `r${r}-${i}`, round: r, position: i, playerAId: null, playerBId: null, winnerId: null, loserId: null });
    }
  }

  const r1Matches = matches.filter(m => m.round === 1);
  for (const m of r1Matches) {
    if (m.winnerId) {
      const nextRound = 2;
      const nextPosition = Math.floor(m.position / 2);
      const nextMatch = matches.find(nm => nm.round === nextRound && nm.position === nextPosition);
      if (nextMatch) {
        if (m.position % 2 === 0) nextMatch.playerAId = m.winnerId;
        else nextMatch.playerBId = m.winnerId;
        
        if (nextMatch.playerAId && nextMatch.playerBId === null) { nextMatch.winnerId = nextMatch.playerAId; }
        else if (nextMatch.playerBId && nextMatch.playerAId === null) { nextMatch.winnerId = nextMatch.playerBId; }
      }
    }
  }

  return matches;
}

export function advanceBracket(matches: BracketMatch[], matchId: string, winnerId: string): BracketMatch[] {
  const updated = matches.map(m => ({ ...m }));
  const match = updated.find(m => m.id === matchId);
  if (!match) return updated;

  const loserId = match.playerAId === winnerId ? match.playerBId : match.playerAId;
  match.winnerId = winnerId;
  match.loserId = loserId;

  const nextRound = match.round + 1;
  const nextPosition = Math.floor(match.position / 2);
  const nextMatch = updated.find(m => m.round === nextRound && m.position === nextPosition);
  
  if (nextMatch) {
    if (match.position % 2 === 0) nextMatch.playerAId = winnerId;
    else nextMatch.playerBId = winnerId;
  }

  return updated;
}

export function unsetBracketWinnerCascade(matches: BracketMatch[], matchId: string): BracketMatch[] {
  const updated = matches.map(m => ({ ...m }));

  function clearMatch(id: string) {
    const match = updated.find(m => m.id === id);
    if (!match || !match.winnerId) return;

    const prevWinnerId = match.winnerId;
    match.winnerId = null;
    match.loserId = null;

    const nextRound = match.round + 1;
    const nextPosition = Math.floor(match.position / 2);
    const nextMatch = updated.find(m => m.round === nextRound && m.position === nextPosition);

    if (nextMatch) {
      if (nextMatch.playerAId === prevWinnerId || nextMatch.playerBId === prevWinnerId) {
        if (nextMatch.playerAId === prevWinnerId) nextMatch.playerAId = null;
        if (nextMatch.playerBId === prevWinnerId) nextMatch.playerBId = null;
        clearMatch(nextMatch.id);
      }
    }
  }

  clearMatch(matchId);
  return updated;
}

export function getBracketWinner(matches: BracketMatch[]): string | null {
  if (!matches.length) return null;
  const maxRound = Math.max(...matches.map(m => m.round));
  const final = matches.find(m => m.round === maxRound);
  return final?.winnerId ?? null;
}

export function getBracketRounds(matches: BracketMatch[]): BracketMatch[][] {
  if (!matches.length) return [];
  const maxRound = Math.max(...matches.map(m => m.round));
  const rounds: BracketMatch[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    rounds.push(matches.filter(m => m.round === r).sort((a, b) => a.position - b.position));
  }
  return rounds;
}

export const ROUND_NAMES = (round: number, totalRounds: number): string => {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Quartas";
  if (fromEnd === 3) return "Oitavas";
  return `Round ${round}`;
};