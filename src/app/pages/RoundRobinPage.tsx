import { useRef, useState, useEffect } from "react";
import { Download, CheckCircle, Medal } from "lucide-react";
import type { Tournament, Player } from "../store";
import { T, SectionHeader, Btn } from "../components/Shared";
import { fetchSprite } from "../components/PokemonPicker";
import { toPng } from "html-to-image";

type Props = {
  tournament: Tournament;
  players: Player[];
  dark: boolean;
  onSetResult: (rowId: string, colId: string, result: "V" | "D" | null) => void;
  onFinish: () => void;
};

// Componente para renderizar o Pokemon e o Nick de forma padronizada
function PlayerCell({ p, dark }: { p: Player | { id: string; nick: string; pokeId: number }; dark: boolean }) {
  const [sprite, setSprite] = useState<string | null>(null);
  
  useEffect(() => { 
    fetchSprite(p.pokeId).then(s => { 
      if (s) setSprite(s); 
    }); 
  }, [p.pokeId]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "max-content" }}>
      {sprite ? (
        <img 
          src={sprite} 
          alt="" 
          crossOrigin="anonymous" 
          style={{ width: 32, height: 32, imageRendering: "pixelated" }} 
        />
      ) : (
        <div style={{ width: 32, height: 32 }} />
      )}
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: T.text(dark) }}>
        {p.nick}
      </span>
    </div>
  );
}

export function RoundRobinPage({ tournament, players, dark, onSetResult, onFinish }: Props) {
  const rankingRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const isFinished = tournament.status === "finished";

  const tPlayers = tournament.playerIds
    .map(id => players.find(p => p.id === id) ?? tournament.playerSnap?.find(p => p.id === id))
    .filter(Boolean) as Player[];

  const rr = tournament.rrResults ?? {};

  const totalCells = tPlayers.length * (tPlayers.length - 1);
  let filledCells = 0;

  tPlayers.forEach(p1 => {
    tPlayers.forEach(p2 => {
      if (p1.id !== p2.id && (rr[p1.id]?.[p2.id] === "V" || rr[p1.id]?.[p2.id] === "D")) {
        filledCells++;
      }
    });
  });

  const progress = totalCells === 0 ? 0 : Math.round((filledCells / totalCells) * 100);

  // NOVA FUNÇÃO COM HTML-TO-IMAGE
  const exportImage = async (ref: React.RefObject<HTMLDivElement | null>, fileName: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { 
        backgroundColor: dark ? "#0f0c29" : "#fff8f0",
        pixelRatio: 2, // Garante alta qualidade (HD)
        filter: (node) => {
          // Filtro que esconde os elementos que têm a tag data-ignore="true" na foto
          if (node instanceof HTMLElement && node.dataset.ignore === "true") return false;
          return true;
        }
      });
      const link = document.createElement("a");
      link.download = `${fileName}-${tournament.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e: any) {
      alert("Erro ao gerar imagem: " + (e.message || "Tente novamente."));
    }
  };

  const getScores = () => {
    return tPlayers.map(p => {
      const r = rr[p.id] ?? {};
      const wins = Object.values(r).filter(v => v === "V").length;
      const losses = Object.values(r).filter(v => v === "D").length;
      const points = wins; 
      return { ...p, wins, losses, points };
    }).sort((a, b) => b.points - a.points);
  };

  const scores = getScores();
  const champion = isFinished ? scores[0] : null;
  const stickyBg = dark ? "#0f0c29" : "#fff8f0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {champion && (
        <div style={{ 
          ...T.card(dark), 
          padding: "20px 24px", 
          textAlign: "center", 
          background: dark ? "linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,100,0,0.08))" : "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,100,0,0.1))" 
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontFamily: "'Bangers','Impact',cursive", fontSize: "1.6rem", color: "#FFD700", letterSpacing: "0.05em" }}>
            CAMPEÃO!
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "8px" }}>
            <PlayerCell p={champion} dark={dark} />
          </div>
        </div>
      )}

      {/* CARTÃO DO RANKING */}
      <div style={{ ...T.card(dark), overflow: "hidden", padding: 0 }}>
        <div ref={rankingRef} style={{ padding: "24px", background: dark ? "#0f0c29" : "#fff8f0" }}>
          <SectionHeader 
            icon="🏆" 
            title={`Classificação — ${tournament.name}`} 
            dark={dark} 
            right={
              <button 
                data-ignore="true" 
                onClick={() => exportImage(rankingRef, "ranking")} 
                style={{ background: "none", border: `1px solid ${T.border(dark)}`, color: T.muted(dark), borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}
              >
                <Download size={12}/> PNG
              </button>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
            {scores.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${T.border(dark)}` }}>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : T.muted(dark), width: "28px", textAlign: "center" }}>
                  {i + 1}º
                </div>
                
                <PlayerCell p={s} dark={dark} />
                
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "20px" }}>
                  <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "0.95rem" }}>{s.wins} V</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "0.95rem" }}>{s.losses} D</span>
                  
                  <div style={{ background: T.accent(dark), color: "#000", padding: "6px 14px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(255,215,0,0.3)" }}>
                    <Medal size={16}/> {s.points} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARTÃO DA MATRIZ */}
      <div style={{ ...T.card(dark), overflowX: "auto", padding: 0 }}>
        <div ref={matrixRef} style={{ padding: "24px", minWidth: "max-content", background: dark ? "#0f0c29" : "#fff8f0" }}>
          <SectionHeader
            icon="⚔️"
            title="Matriz de Partidas"
            dark={dark}
            right={
              <button 
                data-ignore="true" 
                onClick={() => exportImage(matrixRef, "matriz")} 
                style={{ background: "none", border: `1px solid ${T.border(dark)}`, color: T.muted(dark), borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}
              >
                <Download size={12}/> PNG
              </button>
            }
          />
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "800px", marginTop: "20px" }}>
            <thead>
              <tr>
                <th style={{ 
                  position: "sticky", left: 0, zIndex: 10, background: stickyBg,
                  padding: "14px 20px", borderBottom: `2px solid ${T.border(dark)}`, borderRight: `2px solid ${T.border(dark)}`, 
                  textAlign: "left", color: T.muted(dark), boxShadow: "2px 0 5px rgba(0,0,0,0.05)"
                }}>
                  Jogadores
                </th>
                {tPlayers.map(p => (
                  <th key={p.id} style={{ padding: "14px 10px", borderBottom: `2px solid ${T.border(dark)}`, textAlign: "center", color: T.muted(dark) }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <PlayerCell p={p} dark={dark} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tPlayers.map(rowP => {
                return (
                  <tr key={rowP.id}>
                    <td style={{ 
                      position: "sticky", left: 0, zIndex: 5, background: stickyBg,
                      padding: "10px 20px", borderBottom: `1px solid ${T.border(dark)}`, borderRight: `2px solid ${T.border(dark)}`,
                      boxShadow: "2px 0 5px rgba(0,0,0,0.05)"
                    }}>
                      <PlayerCell p={rowP} dark={dark} />
                    </td>
                    
                    {tPlayers.map(colP => {
                      const isSelf = rowP.id === colP.id;
                      const val = rr[rowP.id]?.[colP.id];

                      return (
                        <td key={colP.id} style={{ padding: "8px", borderBottom: `1px solid ${T.border(dark)}`, borderRight: `1px solid ${T.border(dark)}`, textAlign: "center", background: isSelf ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : "transparent" }}>
                          {isSelf ? (
                            <span style={{ color: T.muted(dark) }}>-</span>
                          ) : (
                            <button
                              onClick={() => {
                                if (isFinished) return;
                                const next = val === "V" ? "D" : val === "D" ? null : "V";
                                onSetResult(rowP.id, colP.id, next);
                              }}
                              style={{
                                width: "38px", height: "38px", borderRadius: "8px", 
                                border: `2px solid ${val ? (val === "V" ? "#22c55e" : "#ef4444") : T.border(dark)}`,
                                background: val === "V" ? (dark ? "rgba(34,197,94,0.15)" : "#dcfce7") : val === "D" ? (dark ? "rgba(239,68,68,0.15)" : "#fee2e2") : "transparent",
                                color: val === "V" ? "#22c55e" : val === "D" ? "#ef4444" : T.muted(dark),
                                fontWeight: val ? "bold" : "normal", cursor: isFinished ? "default" : "pointer", 
                                fontSize: "0.95rem", transition: "all 0.15s"
                              }}
                            >
                              {val || "?"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isFinished && (
          <div style={{ padding: "24px", borderTop: `1px solid ${T.border(dark)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", background: dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}>
            <div style={{ width: "100%", maxWidth: "450px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", color: T.muted(dark) }}>
                <span>Progresso do Torneio</span>
                <span style={{ fontWeight: "bold", color: progress === 100 ? "#22c55e" : T.accent(dark) }}>{progress}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", background: T.border(dark), borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? "#22c55e" : T.accent(dark), transition: "width 0.3s ease" }} />
              </div>
            </div>

            <Btn
              onClick={onFinish}
              disabled={progress < 100}
              style={{
                padding: "12px 24px", fontSize: "0.95rem",
                opacity: progress === 100 ? 1 : 0.5,
                cursor: progress === 100 ? "pointer" : "not-allowed",
                background: progress === 100 ? "linear-gradient(135deg,#22c55e,#16a34a)" : T.inputBg(dark),
                color: progress === 100 ? "#fff" : T.muted(dark),
                border: progress === 100 ? "none" : `1px solid ${T.border(dark)}`,
                boxShadow: progress === 100 ? "0 4px 12px rgba(34,197,94,0.3)" : "none"
              }}>
              <CheckCircle size={18}/> Encerrar e Salvar Histórico
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}