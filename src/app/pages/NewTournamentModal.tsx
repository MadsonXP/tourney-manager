import { useState } from "react";
import { X } from "lucide-react";
import type { Player } from "../store";
import { T, PokemonSprite, Btn } from "../components/Shared";

type Props = {
  players: Player[];
  dark: boolean;
  onConfirm: (name: string, mode: "roundrobin" | "bracket", playerIds: string[]) => void;
  onClose: () => void;
};

// Função matemática rápida para checar se um número é 2, 4, 8, 16, 32, etc.
const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

export function NewTournamentModal({ players, dark, onConfirm, onClose }: Props) {
  const [name, setName] = useState(`Torneio #${Math.floor(Math.random() * 900) + 100}`);
  const [mode, setMode] = useState<"roundrobin" | "bracket">("roundrobin");
  const [selected, setSelected] = useState<string[]>(players.map(p => p.id));

  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSel = selected.length === players.length;

  // Lógica de validação alterada:
  // Se for Round Robin, basta 2 jogadores. 
  // Se for Bracket, precisa ser 2, 4, 8, 16, 32...
  const canCreate = name.trim() && (
    mode === "roundrobin" 
      ? selected.length >= 2 
      : (selected.length >= 2 && isPowerOfTwo(selected.length))
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "auto", ...T.card(dark), zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ color: accent, fontFamily: "'Bangers','Impact',cursive", fontSize: "1.4rem", letterSpacing: "0.05em", margin: 0 }}>
            ⚔️ Novo Torneio
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: muted, cursor: "pointer", display: "flex", padding: "4px" }}><X size={20}/></button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Name */}
          <div>
            <label style={{ color: muted, fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>Nome do torneio</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "10px", padding: "10px 14px", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" }}
            />
          </div>

          {/* Mode */}
          <div>
            <label style={{ color: muted, fontSize: "0.8rem", display: "block", marginBottom: "8px" }}>Formato</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {([
                { value: "roundrobin", icon: "🔄", title: "Round Robin", desc: "Todos jogam contra todos. Qualquer número de jogadores." },
                { value: "bracket",    icon: "⚔️", title: "Chaveamento", desc: "Eliminatório. Requer exatamente 4, 8, 16 ou 32 treinadores." },
              ] as const).map(opt => (
                <button key={opt.value} onClick={() => setMode(opt.value)}
                  style={{
                    background: mode === opt.value ? (dark ? "rgba(255,215,0,0.12)" : "rgba(204,0,0,0.1)") : (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"),
                    border: `2px solid ${mode === opt.value ? accent : border}`,
                    borderRadius: "14px", padding: "14px 12px", cursor: "pointer", textAlign: "left",
                    boxShadow: mode === opt.value ? `0 0 12px ${dark ? "rgba(255,215,0,0.2)" : "rgba(204,0,0,0.15)"}` : "none",
                    transition: "all 0.15s"
                  }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{opt.icon}</div>
                  <div style={{ color: mode === opt.value ? accent : text, fontWeight: 700, fontSize: "0.9rem" }}>{opt.title}</div>
                  <div style={{ color: muted, fontSize: "0.75rem", marginTop: "3px", lineHeight: 1.3 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ color: muted, fontSize: "0.8rem" }}>Treinadores ({selected.length} selecionados)</label>
              <button onClick={() => setSelected(allSel ? [] : players.map(p => p.id))}
                style={{ background: "none", border: `1px solid ${border}`, color: accent, borderRadius: "8px", padding: "3px 10px", cursor: "pointer", fontSize: "0.75rem" }}>
                {allSel ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
              {players.map(p => {
                const sel = selected.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggle(p.id)}
                    style={{
                      background: sel ? (dark ? "rgba(255,215,0,0.1)" : "rgba(204,0,0,0.08)") : "transparent",
                      border: `1px solid ${sel ? accent : border}`,
                      borderRadius: "10px", padding: "8px 12px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "10px", textAlign: "left",
                      transition: "all 0.12s"
                    }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${sel ? accent : muted}`, background: sel ? accent : "none", flexShrink: 0 }} />
                    <PokemonSprite pokeId={p.pokeId} size={28} />
                    <span style={{ color: text, fontSize: "0.88rem", fontWeight: sel ? 600 : 400 }}>{p.nick}</span>
                    {p.titles > 0 && <span style={{ color: "#FFD700", fontSize: "0.75rem", marginLeft: "auto" }}>🏆{p.titles}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info box inteligente */}
          {mode === "bracket" && selected.length > 0 && (
            <div style={{ 
              background: isPowerOfTwo(selected.length) ? (dark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)") : (dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)"), 
              border: `1px solid ${isPowerOfTwo(selected.length) ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`, 
              borderRadius: "10px", padding: "12px 14px", fontSize: "0.85rem", 
              color: isPowerOfTwo(selected.length) ? "#22c55e" : "#ef4444",
              fontWeight: 500, display: "flex", alignItems: "center", gap: "8px"
            }}>
              {isPowerOfTwo(selected.length) 
                ? "✅ Perfeito! Quantidade exata para formar chaves completas."
                : `⚠️ Chaveamento requer 4, 8, 16 ou 32 jogadores (Selecionados: ${selected.length}).`}
            </div>
          )}

          <Btn onClick={() => canCreate && onConfirm(name.trim(), mode, selected)} disabled={!canCreate} style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: canCreate ? 1 : 0.5, cursor: canCreate ? "pointer" : "not-allowed" }}>
            ⚔️ Criar Torneio
          </Btn>
        </div>
      </div>
    </div>
  );
}