// ─── Types ───────────────────────────────────────────────────────────────────

export type Player = {
  id: string;
  nick: string;
  pokeId: number;
  // lifetime stats (updated when tournament is finished)
  totalWins: number;
  totalLosses: number;
  titles: number;
};

export type MatchResult = "A" | "B" | null; // A = player A won, B = player B won

// Round Robin
export type RRResults = {
  [playerId: string]: { [opponentId: string]: "V" | "D" | null };
};

// Bracket
export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  playerAId: string | null; // null = TBD
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
  // Round Robin data
  rrResults?: RRResults;
  // Bracket data
  bracketMatches?: BracketMatch[];
  bracketSize?: number;
  // snapshot of player nicks at tournament time
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
  { id: "p1",  nick: "HunterXP00",   pokeId: 25,  totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p2",  nick: "smaug",        pokeId: 6,   totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p3",  nick: "Kaio10292929", pokeId: 9,   totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p4",  nick: "Rino",         pokeId: 3,   totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p5",  nick: "Alucard",      pokeId: 94,  totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p6",  nick: "Dc_carlos",    pokeId: 133, totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p7",  nick: "Kirito_11",    pokeId: 448, totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p8",  nick: "Guaxinim",     pokeId: 143, totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p9",  nick: "Pesadelo",     pokeId: 196, totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p10", nick: "MGoncalves",   pokeId: 197, totalWins: 0, totalLosses: 0, titles: 0 },
  { id: "p11", nick: "Aípedro",      pokeId: 149, totalWins: 0, totalLosses: 0, titles: 0 },
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
  // pad with byes
  while (shuffled.length < size) shuffled.push("BYE");

  // Round 1
  for (let i = 0; i < size / 2; i++) {
    const pA = shuffled[i * 2] === "BYE" ? null : shuffled[i * 2];
    const pB = shuffled[i * 2 + 1] === "BYE" ? null : shuffled[i * 2 + 1];
    const winnerId = pA === null ? pB : pB === null ? pA : null;
    matches.push({ id: `r1-${i}`, round: 1, position: i, playerAId: pA, playerBId: pB, winnerId, loserId: null });
  }

  // Remaining rounds (TBD)
  for (let r = 2; r <= rounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({ id: `r${r}-${i}`, round: r, position: i, playerAId: null, playerBId: null, winnerId: null, loserId: null });
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

  // Find next match
  const nextRound = match.round + 1;
  const nextPosition = Math.floor(match.position / 2);
  const nextMatch = updated.find(m => m.round === nextRound && m.position === nextPosition);
  if (nextMatch) {
    if (match.position % 2 === 0) nextMatch.playerAId = winnerId;
    else nextMatch.playerBId = winnerId;
    // auto-advance if other slot is null (bye)
    if (nextMatch.playerAId && nextMatch.playerBId === null) { nextMatch.winnerId = nextMatch.playerAId; }
    if (nextMatch.playerBId && nextMatch.playerAId === null) { nextMatch.winnerId = nextMatch.playerBId; }
  }

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
