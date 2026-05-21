import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, CheckCircle } from "lucide-react";
import type { Tournament, Player, RRResults } from "../store";
import { T, SectionHeader, PokemonSprite, Btn } from "../components/Shared";
import { fetchSprite } from "../components/PokemonPicker";
import { useEffect } from "react";

type Props = {
  tournament: Tournament;
  players: Player[];
  dark: boolean;
  onSetResult: (rowId: string, colId: string, result: "V" | "D" | null) => void;
  onFinish: () => void;
};

function cycleResult(c: "V" | "D" | null): "V" | "D" | null {
  if (c === null) return "V";
  if (c === "V") return "D";
  return null;
}

function RunningPokemon({ progress, dark }: { progress: number; dark: boolean }) {
  const [sprite, setSprite] = useState<string | null>(null);
  useEffect(() => { fetchSprite(78).then(s => { if (s) setSprite(s); }); }, []);
  return (
    <div style={{ position: "relative", height: "52px", marginBottom: "4px" }}>
      <div style={{ position: "absolute", bottom: "6px", left: 0, right: 0, height: "8px", background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#FFD700,#FF6B00)", borderRadius: "999px", transition: "width 0.5s ease", width: `${progress}%`, boxShadow: "0 0 8px rgba(255,215,0,0.5)" }} />
      </div>
      {sprite && <img src={sprite} alt="" style={{ position: "absolute", bottom: "12px", left: `calc(${Math.max(0, Math.min(progress, 95))}% - 20px)`, width: 40, height: 40, imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))", transition: "left 0.5s ease", transform: "scaleX(-1)" }} />}
    </div>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function RoundRobinPage({ tournament, players, dark, onSetResult, onFinish }: Props) {
  const results = tournament.rrResults ?? {};
  const tPlayers = tournament.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  const rankingRef = useRef<HTMLDivElement>(null);
  const matrixRef  = useRef<HTMLDivElement>(null);

  const ranking = tPlayers.map(p => {
    const r = results[p.id] ?? {};
    const wins   = Object.values(r).filter(v => v === "V").length;
    const losses = Object.values(r).filter(v => v === "D").length;
    return { ...p, wins, losses, points: wins };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses);

  const totalMatches  = tPlayers.length > 1 ? (tPlayers.length * (tPlayers.length - 1)) / 2 : 0;
  const playedMatches = Object.entries(results).reduce((c, [rid, opps]) =>
    c + Object.entries(opps).filter(([cid, r]) => r === "V" && rid < cid).length, 0);
  const progressPct = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;
  const isComplete  = playedMatches === totalMatches && totalMatches > 0;

  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  // ─── Export ───────────────────────────────────────────────────────────────
  const exportTable = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    // Use html2canvas via CDN-loaded script approach with inline styles snapshot
    const node = ref.current;
    const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any);
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: dark ? "#0f0c29" : "#fff8f0" });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Progress */}
      <div style={{ ...T.card(dark), padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: muted, marginBottom: "4px" }}>
          <span>⚡ {tournament.name} — Progresso</span>
          <span>{playedMatches}/{totalMatches} batalhas ({Math.round(progressPct)}%)</span>
        </div>
        <RunningPokemon progress={progressPct} dark={dark} />
        {isComplete && tournament.status === "active" && (
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
            <Btn onClick={onFinish} style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 2px 12px rgba(34,197,94,0.4)" }}>
              <CheckCircle size={15}/> Encerrar Torneio e Salvar Histórico
            </Btn>
          </div>
        )}
      </div>

      {/* Ranking */}
      <div style={{ ...T.card(dark), overflow: "hidden" }} ref={rankingRef}>
        <SectionHeader icon="🏆" title="Ranking" dark={dark}
          right={
            <button onClick={() => exportTable(rankingRef, `ranking-${tournament.name}`)}
              title="Exportar como imagem"
              style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
              <Download size={12}/> PNG
            </button>
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "2.5rem 1fr 5rem 5rem 5rem", padding: "8px 14px", background: dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)", borderBottom: `1px solid ${border}` }}>
          {["#","Treinador","Pts","⚔️ V","🛡️ D"].map((h, i) => (
            <span key={i} style={{ color: muted, fontSize: "0.75rem", textAlign: i > 1 ? "center" : i === 0 ? "center" : "left" }}>{h}</span>
          ))}
        </div>
        <AnimatePresence mode="popLayout">
          {ranking.map((p, i) => {
            const top3 = i < 3;
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  display: "grid", gridTemplateColumns: "2.5rem 1fr 5rem 5rem 5rem",
                  padding: "10px 14px", borderBottom: `1px solid ${border}`, alignItems: "center",
                  background: top3 ? ["rgba(255,215,0,0.07)","rgba(150,160,180,0.07)","rgba(180,100,30,0.07)"][i] : "transparent",
                  borderLeft: top3 ? ["3px solid #FFD700","3px solid #94a3b8","3px solid #b45309"][i] : "none"
                }}>
                <div style={{ textAlign: "center" }}>{top3 ? <span style={{ fontSize: "1.1rem" }}>{MEDAL[i]}</span> : <span style={{ color: muted, fontSize: "0.85rem" }}>{i + 1}</span>}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <PokemonSprite pokeId={p.pokeId} size={34} />
                  <span style={{ color: text, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nick}</span>
                </div>
                <div style={{ textAlign: "center" }}><span style={{ color: p.points > 0 ? "#FFB000" : muted, fontWeight: p.points > 0 ? 700 : 400, fontSize: "0.85rem" }}>{p.points}</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: p.wins > 0 ? "#22c55e" : muted, fontSize: "0.85rem" }}>{p.wins}</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: p.losses > 0 ? "#ef4444" : muted, fontSize: "0.85rem" }}>{p.losses}</span></div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Matrix */}
      <div style={{ ...T.card(dark), overflow: "hidden" }} ref={matrixRef}>
        <SectionHeader icon="⚔️" title="Matriz de Batalhas" dark={dark}
          right={
            <button onClick={() => exportTable(matrixRef, `matrix-${tournament.name}`)}
              title="Exportar como imagem"
              style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
              <Download size={12}/> PNG
            </button>
          }
        />
        <div style={{ overflowX: "auto", padding: "14px" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "max-content" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px", position: "sticky", left: 0, zIndex: 5, background: dark ? "rgba(15,20,60,0.95)" : "rgba(255,248,220,0.95)" }}>
                  <div style={{ width: "110px", color: muted, fontSize: "0.68rem", textAlign: "left" }}>Linha ↓ × Coluna →</div>
                </th>
                {tPlayers.map(col => (
                  <th key={col.id} style={{ padding: "4px", minWidth: "50px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <PokemonSprite pokeId={col.pokeId} size={30} />
                      <span style={{ color: muted, fontSize: "0.62rem", maxWidth: "50px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={col.nick}>{col.nick}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tPlayers.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: "4px", position: "sticky", left: 0, zIndex: 5, background: dark ? "rgba(15,20,60,0.95)" : "rgba(255,248,220,0.95)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "110px" }}>
                      <PokemonSprite pokeId={row.pokeId} size={28} />
                      <span style={{ color: text, fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.nick}</span>
                    </div>
                  </td>
                  {tPlayers.map(col => {
                    if (row.id === col.id) return (
                      <td key={col.id} style={{ padding: "4px" }}>
                        <div style={{ width: 38, height: 38, margin: "0 auto", borderRadius: "8px", background: dark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.07)", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 12, height: 2, background: border, borderRadius: "999px" }} />
                        </div>
                      </td>
                    );
                    const res = results[row.id]?.[col.id] ?? null;
                    const isV = res === "V", isD = res === "D";
                    return (
                      <td key={col.id} style={{ padding: "4px" }}>
                        <button disabled={tournament.status === "finished"} onClick={() => onSetResult(row.id, col.id, cycleResult(res))}
                          style={{
                            width: 38, height: 38, margin: "0 auto", borderRadius: "8px", border: "1px solid",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: tournament.status === "finished" ? "default" : "pointer",
                            fontSize: "0.82rem", fontWeight: 700, transition: "all 0.15s",
                            ...(isV ? { background: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.5)", color: "#22c55e" }
                              : isD ? { background: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)", color: "#ef4444" }
                              : { background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderColor: border, color: muted })
                          }}>
                          {isV ? "V" : isD ? "D" : "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.03)" }}>
          <p style={{ color: muted, fontSize: "0.72rem", textAlign: "center", margin: 0 }}>Clique: · → V → D → · &nbsp;|&nbsp; Resultados espelhados automaticamente ⚡</p>
        </div>
      </div>
    </div>
  );
}
