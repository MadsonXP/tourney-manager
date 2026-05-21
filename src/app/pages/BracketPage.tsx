import { useRef, useState, useEffect } from "react";
import { Download, CheckCircle } from "lucide-react";
import type { Tournament, Player } from "../store";
import { getBracketRounds, getBracketWinner, ROUND_NAMES } from "../store";
import { T, SectionHeader, PokemonSprite, Btn } from "../components/Shared";
import { fetchSprite } from "../components/PokemonPicker";

type Props = {
  tournament: Tournament;
  players: Player[];
  dark: boolean;
  onSetWinner: (matchId: string, winnerId: string) => void;
  onUnsetWinner: (matchId: string) => void;
  onFinish: () => void;
};

// Componente que renderiza um único slot de jogador com seu Sprite
function PlayerSlot({ playerId, players, playerSnap, dark, highlight }: { playerId: string | null; players: Player[]; playerSnap?: { id: string; nick: string; pokeId: number }[]; dark: boolean; highlight?: "winner" | "loser" }) {
  // Procura no estado atual, se não achar, procura no histórico do torneio
  const p = playerId ? (players.find(pl => pl.id === playerId) ?? playerSnap?.find(pl => pl.id === playerId)) : null;
  const [sprite, setSprite] = useState<string | null>(null);
  
  useEffect(() => { 
    if (p?.pokeId) {
      fetchSprite(p.pokeId).then(s => { if (s) setSprite(s); }); 
    }
  }, [p?.pokeId]);

  const isBye = !playerId;
  const muted = T.muted(dark);
  const text  = T.text(dark);
  
  const bg = highlight === "winner" ? (dark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.12)") :
             highlight === "loser"  ? (dark ? "rgba(239,68,68,0.1)"  : "rgba(239,68,68,0.08)") :
             isBye ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") :
             (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)");
             
  const borderC = highlight === "winner" ? "rgba(34,197,94,0.5)" :
                  highlight === "loser"  ? "rgba(239,68,68,0.4)" :
                  T.border(dark);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: bg, border: `1px solid ${borderC}`, borderRadius: "8px", minWidth: "160px", height: "46px" }}>
      {isBye ? (
        <span style={{ color: muted, fontSize: "0.75rem", fontStyle: "italic", textAlign: "center", width: "100%" }}>BYE (Vazio)</span>
      ) : p ? (
        <>
          {sprite ? <img src={sprite} alt="" style={{ width: 30, height: 30, imageRendering: "pixelated", flexShrink: 0 }} /> : <div style={{ width: 30, height: 30, flexShrink: 0 }} />}
          <span style={{ color: highlight === "winner" ? "#22c55e" : highlight === "loser" ? "#ef4444" : text, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: highlight === "winner" ? 700 : 500 }}>
            {highlight === "winner" && "⚡ "}{p.nick}
          </span>
        </>
      ) : (
        <span style={{ color: muted, fontSize: "0.75rem", fontStyle: "italic", textAlign: "center", width: "100%" }}>Aguardando...</span>
      )}
    </div>
  );
}

export function BracketPage({ tournament, players, dark, onSetWinner, onUnsetWinner, onFinish }: Props) {
  const matches   = tournament.bracketMatches ?? [];
  const rounds    = getBracketRounds(matches);
  const winnerId  = getBracketWinner(matches);
  const totalR    = rounds.length;
  const bracketRef = useRef<HTMLDivElement>(null);

  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  // Busca o campeão, verificando no Snap também
  const champion = winnerId ? (players.find(p => p.id === winnerId) ?? tournament.playerSnap?.find(p => p.id === winnerId)) : null;
  const isFinished = tournament.status === "finished";

  const exportBracket = async () => {
    if (!bracketRef.current) return;
    const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any);
    const canvas = await html2canvas(bracketRef.current, { scale: 2, useCORS: true, backgroundColor: dark ? "#0f0c29" : "#fff8f0" });
    const link = document.createElement("a");
    link.download = `bracket-${tournament.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Banner de Campeão */}
      {champion && (
        <div style={{ ...T.card(dark), padding: "20px 24px", textAlign: "center", background: dark ? "linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,100,0,0.08))" : "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,100,0,0.1))" }}>
          <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontFamily: "'Bangers','Impact',cursive", fontSize: "1.6rem", color: "#FFD700", letterSpacing: "0.05em" }}>CAMPEÃO!</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "8px" }}>
            <PokemonSprite pokeId={champion.pokeId} size={48} />
            <span style={{ color: text, fontSize: "1.2rem", fontWeight: 700 }}>{champion.nick}</span>
          </div>
          {!isFinished && (
            <div style={{ marginTop: "14px" }}>
              <Btn onClick={onFinish} style={{ margin: "0 auto", background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 2px 12px rgba(34,197,94,0.4)" }}>
                <CheckCircle size={15}/> Encerrar e Salvar Histórico
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* Interface da Chave */}
      <div style={{ ...T.card(dark), overflow: "hidden" }} ref={bracketRef}>
        <SectionHeader icon="⚔️" title={`Chaveamento — ${tournament.name}`} dark={dark}
          right={
            <button onClick={exportBracket} title="Exportar como imagem"
              style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
              <Download size={12}/> PNG
            </button>
          }
        />
        
        {/* Usando flexbox para espaçamento automático perfeito */}
        <div style={{ overflowX: "auto", padding: "30px 20px" }}>
          <div style={{ display: "flex", gap: "40px", alignItems: "stretch", minWidth: "max-content" }}>
            {rounds.map((roundMatches, ri) => {
              const roundNum = ri + 1;
              return (
                <div key={ri} style={{ display: "flex", flexDirection: "column", minWidth: "200px" }}>
                  
                  {/* Nome do Round */}
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <span style={{ color: accent, fontFamily: "'Bangers','Impact',cursive", fontSize: "1.1rem", letterSpacing: "0.05em" }}>
                      {ROUND_NAMES(roundNum, totalR)}
                    </span>
                  </div>

                  {/* Lutas do Round usando space-around para alinhamento natural vertical */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                    {roundMatches.map(match => {
                      const pA = match.playerAId ? players.find(p => p.id === match.playerAId) : null;
                      const pB = match.playerBId ? players.find(p => p.id === match.playerBId) : null;
                      const canPlay = match.playerAId && match.playerBId && !match.winnerId && !isFinished;
                      const isBye = (match.playerAId && !match.playerBId) || (!match.playerAId && match.playerBId);

                      return (
                        <div key={match.id} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>
                          
                          {/* Linha conectora estética */}
                          {ri < totalR - 1 && (
                            <div style={{ position: "absolute", right: "-20px", top: "50%", width: "20px", height: "2px", background: border, zIndex: 0 }} />
                          )}
                          {ri > 0 && (
                            <div style={{ position: "absolute", left: "-20px", top: "50%", width: "20px", height: "2px", background: border, zIndex: 0 }} />
                          )}

                          {/* Jogador Cima */}
                          <div
                            onClick={() => canPlay && match.playerAId ? onSetWinner(match.id, match.playerAId) : undefined}
                            style={{ cursor: canPlay ? "pointer" : "default", zIndex: 1, position: "relative" }}
                          >
                            <PlayerSlot
                              playerId={match.playerAId} players={players} playerSnap={tournament.playerSnap} dark={dark}
                              highlight={match.winnerId === match.playerAId ? "winner" : match.loserId === match.playerAId ? "loser" : undefined}
                            />
                          </div>

                          {/* Divisão VS & Botão Desfazer */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "2px 6px" }}>
                            <div style={{ flex: 1, height: "1px", background: border }} />
                            <span style={{ color: muted, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
                              {isBye ? "bye" : "vs"}
                            </span>
                            <div style={{ flex: 1, height: "1px", background: border }} />
                            {match.winnerId && !isFinished && !isBye && (
                              <button
                                onClick={() => onUnsetWinner(match.id)} title="Desfazer Luta"
                                style={{ background: "none", border: `1px solid ${border}`, color: "#ef4444", borderRadius: "6px", padding: "2px 6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: "bold" }}>
                                ↺
                              </button>
                            )}
                          </div>

                          {/* Jogador Baixo */}
                          <div
                            onClick={() => canPlay && match.playerBId ? onSetWinner(match.id, match.playerBId) : undefined}
                            style={{ cursor: canPlay ? "pointer" : "default", zIndex: 1, position: "relative" }}
                          >
                            <PlayerSlot
                              playerId={match.playerBId} players={players} playerSnap={tournament.playerSnap} dark={dark}
                              highlight={match.winnerId === match.playerBId ? "winner" : match.loserId === match.playerBId ? "loser" : undefined}
                            />
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.03)" }}>
          <p style={{ color: muted, fontSize: "0.75rem", textAlign: "center", margin: 0 }}>
            Clique na carta do jogador para registrar a vitória. Use ↺ para desfazer o resultado. ⚡
          </p>
        </div>
      </div>
    </div>
  );
}