import { useState } from "react";
import { Pencil, Check, X, Plus, Trophy, Users, Swords, Trash2 } from "lucide-react";
import type { AppState, Tournament } from "../store";
import { T, SectionHeader, Btn } from "../components/Shared";

type Props = {
  state: AppState;
  dark: boolean;
  onUpdateGuild: (guild: AppState["guild"]) => void;
  onSetActive: (id: string) => void;
  onNewTournament: () => void;
  onDeleteTournament: (id: string) => void;
};

function TournamentCard({ t, players, dark, onSetActive, onDelete }: { t: Tournament; players: AppState["players"]; dark: boolean; onSetActive: () => void; onDelete: () => void }) {
  const snap = t.playerSnap ?? [];
  const winner = t.status === "finished"
    ? (() => {
        if (t.mode === "roundrobin" && t.rrResults) {
          const scores = t.playerIds.map(id => {
            const r = t.rrResults![id] ?? {};
            return { id, wins: Object.values(r).filter(v => v === "V").length };
          });
          scores.sort((a, b) => b.wins - a.wins);
          const p = players.find(p => p.id === scores[0]?.id) ?? snap.find(p => p.id === scores[0]?.id);
          return p?.nick ?? "—";
        }
        if (t.mode === "bracket" && t.bracketMatches) {
          const maxR = Math.max(...t.bracketMatches.map(m => m.round));
          const final = t.bracketMatches.find(m => m.round === maxR);
          if (final?.winnerId) {
            const p = players.find(p => p.id === final.winnerId) ?? snap.find(p => p.id === final.winnerId);
            return p?.nick ?? "—";
          }
        }
        return "—";
      })()
    : null;

  const modeLabel = t.mode === "roundrobin" ? "Round Robin" : "Bracket";
  const modeIcon  = t.mode === "roundrobin" ? "🔄" : "⚔️";
  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);

  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      border: `1px solid ${T.border(dark)}`,
      borderRadius: "14px", padding: "14px 16px",
      display: "flex", alignItems: "center", gap: "14px"
    }}>
      <div style={{ fontSize: "1.6rem" }}>{t.status === "finished" ? "🏆" : "⚡"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: text, fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
        <div style={{ color: muted, fontSize: "0.75rem", marginTop: "2px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span>{modeIcon} {modeLabel}</span>
          <span>👥 {t.playerIds.length} treinadores</span>
          <span>📅 {new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
          {winner && <span style={{ color: "#FFD700" }}>🥇 {winner}</span>}
        </div>
      </div>
      {t.status === "active" && (
        <Btn onClick={onSetActive} style={{ fontSize: "0.8rem", padding: "6px 12px" }}>Abrir</Btn>
      )}
      {t.status === "finished" && (
        <span style={{ color: muted, fontSize: "0.75rem", border: `1px solid ${T.border(dark)}`, borderRadius: "8px", padding: "4px 10px" }}>Encerrado</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir torneio "${t.name}"?`)) onDelete(); }}
        title="Excluir torneio"
        style={{ background: "none", border: `1px solid rgba(239,68,68,0.3)`, color: "rgba(239,68,68,0.7)", borderRadius: "8px", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
      >
        <Trash2 size={13}/>
      </button>
    </div>
  );
}

export function GuildPage({ state, dark, onUpdateGuild, onSetActive, onNewTournament, onDeleteTournament }: Props) {
  const [editingGuild, setEditingGuild] = useState(false);
  const [draft, setDraft] = useState(state.guild);
  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  const active   = state.tournaments.filter(t => t.status === "active");
  const finished = state.tournaments.filter(t => t.status === "finished");

  const totalWins   = state.players.reduce((s, p) => s + p.totalWins, 0);
  const totalTitles = state.players.reduce((s, p) => s + p.titles, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Guild banner */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <div style={{ padding: "24px", background: dark ? "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,100,0,0.05))" : "linear-gradient(135deg,rgba(204,0,0,0.07),rgba(255,150,0,0.05))" }}>
          {editingGuild ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Nome da guilda"
                style={{ background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "10px", padding: "8px 14px", fontSize: "1rem", outline: "none" }}
              />
              <input value={draft.motto} onChange={e => setDraft(d => ({ ...d, motto: e.target.value }))}
                placeholder="Lema da guilda"
                style={{ background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "10px", padding: "8px 14px", fontSize: "0.9rem", outline: "none" }}
              />
              <textarea value={draft.announcement} onChange={e => setDraft(d => ({ ...d, announcement: e.target.value }))}
                placeholder="📢 Aviso para os membros (opcional)..."
                rows={2}
                style={{ background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "10px", padding: "8px 14px", fontSize: "0.85rem", outline: "none", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn onClick={() => { onUpdateGuild(draft); setEditingGuild(false); }}><Check size={14}/> Salvar</Btn>
                <Btn variant="ghost" onClick={() => { setDraft(state.guild); setEditingGuild(false); }}><X size={14}/> Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <h1 style={{ fontFamily: "'Bangers','Impact',cursive", fontSize: "2rem", letterSpacing: "0.06em", background: `linear-gradient(135deg,${accent},#FF6B00)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 4px 0" }}>
                    {state.guild.name}
                  </h1>
                  <p style={{ color: muted, fontSize: "0.9rem", margin: 0 }}>{state.guild.motto}</p>
                </div>
                <button onClick={() => { setDraft(state.guild); setEditingGuild(true); }}
                  style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}>
                  <Pencil size={12}/> Editar
                </button>
              </div>
              {state.guild.announcement && (
                <div style={{ marginTop: "14px", background: dark ? "rgba(255,215,0,0.08)" : "rgba(204,0,0,0.06)", border: `1px solid ${border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "0.85rem", color: text }}>
                  📢 {state.guild.announcement}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${border}` }}>
          {[
            { icon: <Users size={18}/>, label: "Treinadores", value: state.players.length },
            { icon: <Swords size={18}/>, label: "Torneios", value: state.tournaments.length },
            { icon: <Trophy size={18}/>, label: "Títulos", value: totalTitles },
          ].map((s, i) => (
            <div key={i} style={{ padding: "14px", textAlign: "center", borderRight: i < 2 ? `1px solid ${border}` : "none" }}>
              <div style={{ color: accent, marginBottom: "4px", display: "flex", justifyContent: "center" }}>{s.icon}</div>
              <div style={{ color: text, fontWeight: 700, fontSize: "1.3rem" }}>{s.value}</div>
              <div style={{ color: muted, fontSize: "0.72rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active tournaments */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader icon="⚡" title="Torneios Ativos" dark={dark}
          right={<Btn onClick={onNewTournament} style={{ fontSize: "0.8rem", padding: "6px 12px" }}><Plus size={14}/> Novo Torneio</Btn>}
        />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {active.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: muted }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚔️</div>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Nenhum torneio ativo.</p>
              <button onClick={onNewTournament} style={{ marginTop: "12px", background: "none", border: `1px solid ${border}`, color: accent, borderRadius: "10px", padding: "8px 18px", cursor: "pointer", fontSize: "0.85rem" }}>
                Criar primeiro torneio
              </button>
            </div>
          ) : active.map(t => (
            <TournamentCard key={t.id} t={t} players={state.players} dark={dark} onSetActive={() => onSetActive(t.id)} onDelete={() => onDeleteTournament(t.id)} />
          ))}
        </div>
      </div>

      {/* History */}
      {finished.length > 0 && (
        <div style={{ ...T.card(dark), overflow: "hidden" }}>
          <SectionHeader icon="📜" title="Histórico" dark={dark} />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {finished.slice().reverse().map(t => (
              <TournamentCard key={t.id} t={t} players={state.players} dark={dark} onSetActive={() => {}} onDelete={() => onDeleteTournament(t.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}