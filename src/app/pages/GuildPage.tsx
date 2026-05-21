import { useState, useRef } from "react";
import { Pencil, Check, X, Plus, Trophy, Users, Swords, Trash2, Download, Upload, Medal } from "lucide-react";
import type { AppState, Tournament } from "../store";
import { T, SectionHeader, Btn, PokemonSprite } from "../components/Shared";

type Props = { 
  state: AppState; 
  dark: boolean; 
  onUpdateGuild: (guild: AppState["guild"]) => void; 
  onSetActive: (id: string) => void; 
  onNewTournament: () => void; 
  onDeleteTournament: (id: string) => void; 
  onResetSeason: () => void; // NOVO: Propriedade recebida para zerar temporada
};

function TournamentCard({ t, players, dark, onSetActive, onDelete }: { t: Tournament; players: AppState["players"]; dark: boolean; onSetActive: () => void; onDelete: () => void }) {
  const snap = t.playerSnap ?? [];
  const winner = t.status === "finished" ? (() => {
    if (t.mode === "roundrobin" && t.rrResults) {
      const scores = t.playerIds.map(id => ({ id, wins: Object.values(t.rrResults![id] ?? {}).filter(v => v === "V").length })).sort((a, b) => b.wins - a.wins);
      return players.find(p => p.id === scores[0]?.id)?.nick ?? snap.find(p => p.id === scores[0]?.id)?.nick ?? "—";
    }
    if (t.mode === "bracket" && t.bracketMatches) {
      const final = t.bracketMatches.find(m => m.round === Math.max(...t.bracketMatches!.map(x => x.round)));
      return players.find(p => p.id === final?.winnerId)?.nick ?? snap.find(p => p.id === final?.winnerId)?.nick ?? "—";
    }
    return "—";
  })() : null;

  return (
    <div style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${T.border(dark)}`, borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ fontSize: "1.6rem" }}>{t.status === "finished" ? "🏆" : "⚡"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: T.text(dark), fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
        <div style={{ color: T.muted(dark), fontSize: "0.75rem", marginTop: "2px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span>{t.mode === "roundrobin" ? "🔄 Round Robin" : "⚔️ Bracket"}</span>
          <span>👥 {t.playerIds.length} treinadores</span>
          {winner && <span style={{ color: "#FFD700" }}>🥇 {winner}</span>}
        </div>
      </div>
      {t.status === "active" && <Btn onClick={onSetActive} style={{ fontSize: "0.8rem", padding: "6px 12px" }}>Abrir</Btn>}
      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir torneio "${t.name}"?`)) onDelete(); }} style={{ background: "none", border: `1px solid rgba(239,68,68,0.3)`, color: "rgba(239,68,68,0.7)", borderRadius: "8px", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "8px" }}><Trash2 size={13}/></button>
    </div>
  );
}

export function GuildPage({ state, dark, onUpdateGuild, onSetActive, onNewTournament, onDeleteTournament, onResetSeason }: Props) {
  const [editingGuild, setEditingGuild] = useState(false);
  const [draft, setDraft] = useState(state.guild);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = state.tournaments.filter(t => t.status === "active");
  const finished = state.tournaments.filter(t => t.status === "finished");
  
  const ranking = [...state.players].sort((a, b) => (b.points || 0) - (a.points || 0));

  const handleExport = () => {
    const data = localStorage.getItem("tourney_v2_state");
    if (!data) return;
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `backup-guilda-${new Date().toISOString().slice(0,10)}.json`; 
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json && json.players && json.tournaments) {
          localStorage.setItem("tourney_v2_state", JSON.stringify(json));
          alert("Banco de dados atualizado! A página será recarregada.");
          window.location.reload();
        } else {
          alert("Arquivo inválido.");
        }
      } catch { 
        alert("Erro ao ler o arquivo."); 
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Botões de Administração (Salvar/Carregar) */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <input type="file" accept=".json" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.border(dark)}`, color: T.text(dark), padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <Upload size={14}/> Carregar Dados
        </button>
        <button onClick={handleExport} style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <Download size={14}/> Salvar Backup
        </button>
      </div>

      {/* Card da Guilda */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <div style={{ padding: "24px", background: dark ? "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,100,0,0.05))" : "linear-gradient(135deg,rgba(204,0,0,0.07),rgba(255,150,0,0.05))" }}>
          {editingGuild ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={{ background: T.inputBg(dark), border: `1px solid ${T.border(dark)}`, color: T.text(dark), borderRadius: "10px", padding: "8px 14px" }} />
              <div style={{ display: "flex", gap: "8px" }}><Btn onClick={() => { onUpdateGuild(draft); setEditingGuild(false); }}><Check size={14}/> Salvar</Btn></div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontFamily: "'Bangers','Impact',cursive", fontSize: "2rem", color: T.accent(dark), margin: "0 0 4px 0" }}>{state.guild.name}</h1>
                <p style={{ color: T.muted(dark), margin: 0 }}>{state.guild.motto}</p>
              </div>
              <button onClick={() => setEditingGuild(true)} style={{ background: "none", border: "none", color: T.muted(dark), cursor: "pointer" }}><Pencil size={14}/></button>
            </div>
          )}
        </div>
      </div>

      {/* Ranking Oficial */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader 
          icon="🏆" 
          title="Ranking Oficial (Pontuação)" 
          dark={dark} 
          right={
            <button onClick={onResetSeason} style={{ background: "none", border: `1px solid rgba(239,68,68,0.4)`, color: "#ef4444", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
              <Trash2 size={12}/> Zerar Ranking
            </button>
          }
        />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {ranking.slice(0, 10).map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", padding: "10px 14px", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : T.muted(dark), width: "24px", textAlign: "center" }}>
                {i + 1}º
              </div>
              <PokemonSprite pokeId={p.pokeId} size={32} />
              <div style={{ flex: 1, color: T.text(dark), fontWeight: 600 }}>{p.nick}</div>
              <div style={{ background: T.accent(dark), color: "#000", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <Medal size={14}/> {p.points || 0} pts
              </div>
            </div>
          ))}
          {ranking.length === 0 && (
            <div style={{ textAlign: "center", color: T.muted(dark), padding: "10px" }}>
              Nenhum jogador registrado ainda.
            </div>
          )}
        </div>
      </div>

      {/* Torneios Ativos */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader icon="⚡" title="Torneios Ativos" dark={dark} right={<Btn onClick={onNewTournament} style={{ fontSize: "0.8rem", padding: "6px 12px" }}><Plus size={14}/> Novo Torneio</Btn>} />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {active.length === 0 && <div style={{ textAlign: "center", color: T.muted(dark) }}>Nenhum torneio ativo no momento.</div>}
          {active.map(t => <TournamentCard key={t.id} t={t} players={state.players} dark={dark} onSetActive={() => onSetActive(t.id)} onDelete={() => onDeleteTournament(t.id)} />)}
        </div>
      </div>

      {/* Histórico de Torneios Encerrados */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader icon="📜" title="Histórico de Torneios" dark={dark} />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {finished.length === 0 && <div style={{ textAlign: "center", color: T.muted(dark) }}>Nenhum torneio encerrado no histórico.</div>}
          {finished.slice().reverse().map(t => (
            <TournamentCard key={t.id} t={t} players={state.players} dark={dark} onSetActive={() => {}} onDelete={() => onDeleteTournament(t.id)} />
          ))}
        </div>
      </div>

    </div>
  );
}