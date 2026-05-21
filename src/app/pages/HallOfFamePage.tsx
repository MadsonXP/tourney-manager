import { Trophy } from "lucide-react";
import type { Tournament, Player } from "../store";
import { T, SectionHeader, PokemonSprite } from "../components/Shared";
import type { AppState } from "../store";

type Props = {
  state: AppState; // Agora ela recebe o AppState completo que tem a guilda
  dark: boolean;
};

// Função para identificar o campeão (reutilizada para consistência)
const getTournamentWinner = (t: Tournament, players: Player[]) => {
  const snap = t.playerSnap ?? [];
  if (t.mode === "roundrobin" && t.rrResults) {
    const scores = t.playerIds.map(id => ({ id, wins: Object.values(t.rrResults![id] ?? {}).filter(v => v === "V").length })).sort((a, b) => b.wins - a.wins);
    const winId = scores[0]?.id;
    return players.find(p => p.id === winId) ?? snap.find(p => p.id === winId) ?? null;
  }
  if (t.mode === "bracket" && t.bracketMatches) {
    const maxR = Math.max(...t.bracketMatches.map(m => m.round));
    const final = t.bracketMatches.find(m => m.round === maxR);
    const winId = final?.winnerId;
    return players.find(p => p.id === winId) ?? snap.find(p => p.id === winId) ?? null;
  }
  return null;
};

export function HallOfFamePage({ state, dark }: Props) {
  const finished = state.tournaments.filter(t => t.status === "finished");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ ...T.card(dark), padding: "20px" }}>
        <SectionHeader icon="🌟" title="Hall da Fama — Lendas da Guilda" dark={dark} />
        <p style={{ color: T.muted(dark), fontSize: "0.9rem", marginTop: "10px" }}>
          Aqui estão os campeões que marcaram a história da {state.guild.name}.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
        {finished.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: T.muted(dark) }}>
            Ainda não há campeões registrados. Vença seu primeiro torneio!
          </div>
        )}
        {finished.slice().reverse().map(t => {
          const champ = getTournamentWinner(t, state.players);
          if (!champ) return null;
          return (
            <div key={t.id} style={{ 
              display: "flex", flexDirection: "column", alignItems: "center", 
              background: dark ? "rgba(255,215,0,0.05)" : "rgba(255,215,0,0.1)", 
              border: `1px solid rgba(255,215,0,0.3)`, padding: "20px", borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏆</div>
              <PokemonSprite pokeId={champ.pokeId} size={64} />
              <span style={{ color: T.text(dark), fontWeight: "bold", fontSize: "1rem", marginTop: "12px" }}>{champ.nick}</span>
              <span style={{ color: T.accent(dark), fontSize: "0.75rem", fontWeight: "bold", marginTop: "4px" }}>{t.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}