import { useRef } from "react";
import { Download, CheckCircle } from "lucide-react";
import type { Tournament, Player } from "../store";
import { getBracketRounds, getBracketWinner, ROUND_NAMES, advanceBracket } from "../store";
import { T, SectionHeader, PokemonSprite, Btn } from "../components/Shared";
import { useState, useEffect } from "react";
import { fetchSprite } from "../components/PokemonPicker";

type Props = {
  tournament: Tournament;
  players: Player[];
  dark: boolean;
  onSetWinner: (matchId: string, winnerId: string) => void;
  onUnsetWinner: (matchId: string) => void;
  onFinish: () => void;
};

function PlayerSlot({ playerId, players, dark, highlight }: { playerId: string | null; players: Player[]; dark: boolean; highlight?: "winner" | "loser" }) {
  const p = playerId ? players.find(pl => pl.id === playerId) : null;
  const [sprite, setSprite] = useState<string | null>(null);
  useEffect(() => { if (p) fetchSprite(p.pokeId).then(s => { if (s) setSprite(s); }); }, [p?.pokeId]);

  const isBye = !playerId;
  const muted = T.muted(dark);
  const text  = T.text(dark);
  const bg =
    highlight === "winner" ? (dark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.12)") :
    highlight === "loser"  ? (dark ? "rgba(239,68,68,0.1)"  : "rgba(239,68,68,0.08)") :
    isBye ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") :
    (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)");
  const borderC =
    highlight === "winner" ? "rgba(34,197,94,0.5)" :
    highlight === "loser"  ? "rgba(239,68,68,0.4)" :
    T.border(dark);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", background: bg, border: `1px solid ${borderC}`, borderRadius: "8px", minWidth: "140px", height: "40px" }}>
      {isBye ? (
        <span style={{ color: muted, fontSize: "0.72rem", fontStyle: "italic" }}>BYE</span>
      ) : p ? (
        <>
          {sprite ? <img src={sprite} alt="" style={{ width: 26, height: 26, imageRendering: "pixelated", flexShrink: 0 }} /> : <div style={{ width: 26, height: 26, flexShrink: 0 }} />}
          <span style={{ color: highlight === "winner" ? "#22c55e" : highlight === "loser" ? "#ef4444" : text, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: highlight === "winner" ? 700 : 400 }}>
            {highlight === "winner" && "⚡ "}{p.nick}
          </span>
        </>
      ) : (
        <span style={{ color: muted, fontSize: "0.72rem", fontStyle: "italic" }}>TBD</span>
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

  const champion = winnerId ? players.find(p => p.id === winnerId) : null;

  const exportBracket = async () => {
    if (!bracketRef.current) return;
    const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any);
    const canvas = await html2canvas(bracketRef.current, { scale: 2, useCORS: true, backgroundColor: dark ? "#0f0c29" : "#fff8f0" });
    const link = document.createElement("a");
    link.download = `bracket-${tournament.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const isFinished = tournament.status === "finished";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Champion banner */}
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

      {/* Bracket visual */}
      <div style={{ ...T.card(dark), overflow: "hidden" }} ref={bracketRef}>
        <SectionHeader icon="⚔️" title={`Chaveamento — ${tournament.name}`} dark={dark}
          right={
            <button onClick={exportBracket} title="Exportar como imagem"
              style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
              <Download size={12}/> PNG
            </button>
          }
        />
        <div style={{ overflowX: "auto", padding: "20px" }}>
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
            {rounds.map((roundMatches, ri) => {
              const roundNum  = ri + 1;
              const roundName = ROUND_NAMES(roundNum, totalR);
              return (
                <div key={ri} style={{ display: "flex", flexDirection: "column", gap: "0", minWidth: "180px" }}>
                  {/* Round label */}
                  <div style={{ textAlign: "center", marginBottom: "12px" }}>
                    <span style={{ color: accent, fontFamily: "'Bangers','Impact',cursive", fontSize: "1rem", letterSpacing: "0.05em" }}>{roundName}</span>
                  </div>
                  {/* Matches in this round with vertical spacing to align with connector lines */}
                  <div style={{ display: "flex", flexDirection: "column", gap: `${Math.pow(2, ri) * 8 + (ri > 0 ? Math.pow(2, ri - 1) * 48 : 0)}px` }}>
                    {roundMatches.map(match => {
                      const pA = match.playerAId ? players.find(p => p.id === match.playerAId) : null;
                      const pB = match.playerBId ? players.find(p => p.id === match.playerBId) : null;
                      const canPlay = match.playerAId && match.playerBId && !match.winnerId && !isFinished;
                      const isBye = (match.playerAId && !match.playerBId) || (!match.playerAId && match.playerBId);

                      return (
                        <div key={match.id} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {/* Player A */}
                          <div
                            onClick={() => canPlay && match.playerAId ? onSetWinner(match.id, match.playerAId) : undefined}
                            style={{ cursor: canPlay ? "pointer" : "default", transition: "transform 0.1s" }}
                            title={canPlay ? `${pA?.nick} venceu` : undefined}
                          >
                            <PlayerSlot
                              playerId={match.playerAId}
                              players={players}
                              dark={dark}
                              highlight={match.winnerId === match.playerAId ? "winner" : match.loserId === match.playerAId ? "loser" : undefined}
                            />
                          </div>
                          {/* VS divider */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "1px 6px" }}>
                            <div style={{ flex: 1, height: "1px", background: border }} />
                            <span style={{ color: muted, fontSize: "0.65rem" }}>{isBye ? "bye" : "vs"}</span>
                            <div style={{ flex: 1, height: "1px", background: border }} />
                            {match.winnerId && !isFinished && (
                              <button
                                onClick={() => onUnsetWinner(match.id)}
                                title="Desfazer resultado"
                                style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "4px", padding: "1px 5px", cursor: "pointer", fontSize: "0.6rem" }}>
                                ↺
                              </button>
                            )}
                          </div>
                          {/* Player B */}
                          <div
                            onClick={() => canPlay && match.playerBId ? onSetWinner(match.id, match.playerBId) : undefined}
                            style={{ cursor: canPlay ? "pointer" : "default" }}
                            title={canPlay ? `${pB?.nick} venceu` : undefined}
                          >
                            <PlayerSlot
                              playerId={match.playerBId}
                              players={players}
                              dark={dark}
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
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.03)" }}>
          <p style={{ color: muted, fontSize: "0.72rem", textAlign: "center", margin: 0 }}>
            Clique no nome do jogador para registrar a vitória. Use ↺ para desfazer. ⚡
          </p>
        </div>
      </div>
    </div>
  );
}
