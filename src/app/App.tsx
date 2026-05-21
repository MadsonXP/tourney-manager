import { useState, useEffect } from "react";
import { Sun, Moon, Home, Users, Swords, Plus } from "lucide-react";
import { loadState, saveState, generateBracket, advanceBracket, getBracketWinner, unsetBracketWinnerCascade } from "./store";
import type { AppState, Tournament, RRResults } from "./store";
import { fetchSprite } from "./components/PokemonPicker";
import { T } from "./components/Shared";

import { GuildPage }          from "./pages/GuildPage";
import { PlayersPage }        from "./pages/PlayersPage";
import { NewTournamentModal } from "./pages/NewTournamentModal";
import { RoundRobinPage }     from "./pages/RoundRobinPage";
import { BracketPage }        from "./pages/BracketPage";

type Tab = "guild" | "players" | "tournament";

const PokeballBg = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
       style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.035, pointerEvents: "none" }}
       preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="pbg" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
        <g transform="translate(80,80)">
          <circle cx="0" cy="0" r="60" fill="none" stroke="white" strokeWidth="4"/>
          <path d="M-60,0 A60,60 0 0,1 60,0 Z" fill="white" opacity="0.3"/>
          <line x1="-60" y1="0" x2="60" y2="0" stroke="white" strokeWidth="4"/>
          <circle cx="0" cy="0" r="18" fill="none" stroke="white" strokeWidth="4"/>
          <circle cx="0" cy="0" r="10" fill="white" opacity="0.5"/>
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pbg)"/>
  </svg>
);

function PikachuHeader() {
  const [sprite, setSprite] = useState<string | null>(null);
  useEffect(() => { fetchSprite(25).then(s => { if (s) setSprite(s); }); }, []);
  if (!sprite) return <div style={{ width: 56, height: 56 }} />;
  return (
    <img src={sprite} alt="Pikachu" style={{ width: 56, height: 56, imageRendering: "pixelated", filter: "drop-shadow(0 0 10px rgba(255,215,0,0.7))", animation: "bounce 0.6s ease-in-out infinite alternate" }} />
  );
}

export default function App() {
  const [state, setState]       = useState<AppState>(loadState);
  const [dark, setDark]         = useState(() => { try { return JSON.parse(localStorage.getItem("tourney_dark") ?? "true"); } catch { return true; } });
  const [tab, setTab]           = useState<Tab>("guild");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { localStorage.setItem("tourney_dark", JSON.stringify(dark)); }, [dark]);

  const activeTournament = state.activeTournamentId
    ? state.tournaments.find(t => t.id === state.activeTournamentId) ?? null
    : null;

  const updateGuild = (guild: AppState["guild"]) => setState(s => ({ ...s, guild }));

  const addPlayer = (nick: string, pokeId: number) => {
    const id = crypto.randomUUID();
    setState(s => ({ ...s, players: [...s.players, { id, nick, pokeId, totalWins: 0, totalLosses: 0, titles: 0, points: 0 }] }));
  };
  const removePlayer = (id: string) => setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }));
  const editPlayer = (id: string, nick: string, pokeId: number) =>
    setState(s => ({ ...s, players: s.players.map(p => p.id === id ? { ...p, nick, pokeId } : p) }));

  const createTournament = (name: string, mode: "roundrobin" | "bracket", playerIds: string[]) => {
    const id = crypto.randomUUID();
    const snap = playerIds.map(pid => { const p = state.players.find(pl => pl.id === pid)!; return { id: pid, nick: p.nick, pokeId: p.pokeId }; });
    let t: Tournament = { id, name, mode, playerIds, status: "active", createdAt: new Date().toISOString(), playerSnap: snap };

    if (mode === "roundrobin") {
      const rr: RRResults = {};
      playerIds.forEach(a => { rr[a] = {}; playerIds.forEach(b => { if (a !== b) rr[a][b] = null; }); });
      t.rrResults = rr;
    } else {
      t.bracketMatches = generateBracket(playerIds);
      t.bracketSize    = t.bracketMatches.length;
    }
    setState(s => ({ ...s, tournaments: [...s.tournaments, t], activeTournamentId: id }));
    setShowModal(false);
    setTab("tournament");
  };

  const setRRResult = (rowId: string, colId: string, result: "V" | "D" | null) => {
    if (!activeTournament || activeTournament.mode !== "roundrobin") return;
    setState(s => ({
      ...s,
      tournaments: s.tournaments.map(t => {
        if (t.id !== activeTournament.id) return t;
        const rr = { ...t.rrResults! };
        rr[rowId] = { ...rr[rowId], [colId]: result };
        if (result === "V") rr[colId] = { ...rr[colId], [rowId]: "D" };
        else if (result === "D") rr[colId] = { ...rr[colId], [rowId]: "V" };
        else rr[colId] = { ...rr[colId], [rowId]: null };
        return { ...t, rrResults: rr };
      })
    }));
  };

  const setBracketWinner = (matchId: string, winnerId: string) => {
    if (!activeTournament || activeTournament.mode !== "bracket") return;
    setState(s => ({
      ...s, tournaments: s.tournaments.map(t => t.id === activeTournament.id ? { ...t, bracketMatches: advanceBracket(t.bracketMatches ?? [], matchId, winnerId) } : t)
    }));
  };

  const unsetBracketWinner = (matchId: string) => {
    if (!activeTournament || activeTournament.mode !== "bracket") return;
    setState(s => ({
      ...s, tournaments: s.tournaments.map(t => t.id === activeTournament.id ? { ...t, bracketMatches: unsetBracketWinnerCascade(t.bracketMatches ?? [], matchId) } : t)
    }));
  };

  // 1. CORREÇÃO NA EXCLUSÃO: Agora subtrai os pontos se o torneio já estava finalizado
  const deleteTournament = (id: string) => {
    setState(s => {
      const t = s.tournaments.find(x => x.id === id);
      if (!t) return s;

      let updatedPlayers = s.players;

      if (t.status === "finished") {
        updatedPlayers = s.players.map(p => {
          if (!t.playerIds.includes(p.id)) return p;
          
          let wins = 0, losses = 0, earnedPoints = 0, earnedTitle = 0;

          if (t.mode === "roundrobin" && t.rrResults) {
            const scores = t.playerIds.map(pid => {
              const r = t.rrResults![pid] ?? {};
              return { id: pid, wins: Object.values(r).filter(v => v === "V").length };
            }).sort((a, b) => b.wins - a.wins);
            
            if (scores[0]?.id === p.id) { earnedPoints = 3; earnedTitle = 1; }
            else if (scores[1]?.id === p.id) earnedPoints = 2;
            else if (scores[2]?.id === p.id) earnedPoints = 1;

            const r = t.rrResults[p.id] ?? {};
            wins = Object.values(r).filter(v => v === "V").length;
            losses = Object.values(r).filter(v => v === "D").length;

          } else if (t.mode === "bracket" && t.bracketMatches) {
            const maxR = Math.max(...t.bracketMatches.map(m => m.round));
            const finalMatch = t.bracketMatches.find(m => m.round === maxR);
            const semiMatches = t.bracketMatches.filter(m => m.round === maxR - 1);

            if (finalMatch?.winnerId === p.id) { earnedPoints = 3; earnedTitle = 1; }
            else if (finalMatch?.loserId === p.id) earnedPoints = 2;
            else if (semiMatches.some(m => m.loserId === p.id)) earnedPoints = 1;

            wins = t.bracketMatches.filter(m => m.winnerId === p.id).length;
            losses = t.bracketMatches.filter(m => m.loserId === p.id).length;
          }

          return { 
            ...p, 
            totalWins: Math.max(0, p.totalWins - wins), 
            totalLosses: Math.max(0, p.totalLosses - losses), 
            titles: Math.max(0, p.titles - earnedTitle),
            points: Math.max(0, (p.points || 0) - earnedPoints)
          };
        });
      }

      return {
        ...s,
        players: updatedPlayers,
        tournaments: s.tournaments.filter(x => x.id !== id),
        activeTournamentId: s.activeTournamentId === id ? null : s.activeTournamentId,
      };
    });
  };

  const finishTournament = () => {
    if (!activeTournament) return;
    setState(s => {
      const t = s.tournaments.find(t => t.id === activeTournament.id)!;
      let champId: string | null = null;

      const updatedPlayers = s.players.map(p => {
        if (!t.playerIds.includes(p.id)) return p;
        let wins = 0, losses = 0, earnedPoints = 0, earnedTitle = 0;

        if (t.mode === "roundrobin" && t.rrResults) {
          const scores = t.playerIds.map(id => {
            const r = t.rrResults![id] ?? {};
            return { id, wins: Object.values(r).filter(v => v === "V").length };
          }).sort((a, b) => b.wins - a.wins);
          
          if (scores[0]?.id === p.id) { earnedPoints = 3; earnedTitle = 1; champId = p.id; }
          else if (scores[1]?.id === p.id) earnedPoints = 2;
          else if (scores[2]?.id === p.id) earnedPoints = 1;

          const r = t.rrResults[p.id] ?? {};
          wins = Object.values(r).filter(v => v === "V").length;
          losses = Object.values(r).filter(v => v === "D").length;

        } else if (t.mode === "bracket" && t.bracketMatches) {
          const maxR = Math.max(...t.bracketMatches.map(m => m.round));
          const finalMatch = t.bracketMatches.find(m => m.round === maxR);
          const semiMatches = t.bracketMatches.filter(m => m.round === maxR - 1);

          champId = finalMatch?.winnerId ?? null;

          if (finalMatch?.winnerId === p.id) { earnedPoints = 3; earnedTitle = 1; }
          else if (finalMatch?.loserId === p.id) earnedPoints = 2;
          else if (semiMatches.some(m => m.loserId === p.id)) earnedPoints = 1;

          wins = t.bracketMatches.filter(m => m.winnerId === p.id).length;
          losses = t.bracketMatches.filter(m => m.loserId === p.id).length;
        }

        return { 
          ...p, totalWins: p.totalWins + wins, totalLosses: p.totalLosses + losses, 
          titles: p.titles + earnedTitle, points: (p.points || 0) + earnedPoints
        };
      });

      const updatedTournaments = s.tournaments.map(t2 =>
        t2.id === activeTournament.id ? { ...t2, status: "finished" as const, finishedAt: new Date().toISOString() } : t2
      );

      return { ...s, players: updatedPlayers, tournaments: updatedTournaments, activeTournamentId: null };
    });
    setTab("guild");
  };

  // 2. NOVA FUNÇÃO: ZERAR RANKING MENSAL (Limpa fantasmas atuais)
  const resetSeason = () => {
    if (confirm("Tem certeza que deseja ZERAR o ranking atual? Os pontos e vitórias de todos os jogadores voltarão a 0. (O histórico de torneios NÃO será apagado).")) {
      setState(s => ({
        ...s,
        players: s.players.map(p => ({ ...p, totalWins: 0, totalLosses: 0, titles: 0, points: 0 }))
      }));
    }
  };

  const accent = T.accent(dark);
  const muted  = T.muted(dark);

  const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "guild",      icon: <Home size={18}/>,   label: "Guilda" },
    { key: "players",    icon: <Users size={18}/>,  label: "Treinadores" },
    { key: "tournament", icon: <Swords size={18}/>, label: activeTournament ? activeTournament.name : "Torneio" },
  ];

  return (
    <>
      <style>{`@keyframes bounce { from{transform:translateY(0) scaleX(-1)} to{transform:translateY(-6px) scaleX(-1)} }`}</style>
      <div style={{
        minHeight: "100vh", position: "relative",
        background: dark ? "linear-gradient(135deg,#0f0c29 0%,#1a1a3e 45%,#0d1b2a 100%)" : "linear-gradient(135deg,#ffecd2 0%,#fcb69f 45%,#ffd6e7 100%)",
        transition: "background 0.3s"
      }}>
        <PokeballBg />

        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "radial-gradient(circle,rgba(250,204,21,0.1) 0%,transparent 70%)", width: `${160 + i * 80}px`, height: `${160 + i * 80}px`, top: `${[8,65,20,78][i]}%`, left: `${[5,82,48,14][i]}%`, transform: "translate(-50%,-50%)" }} />
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", padding: "20px 14px 80px" }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <PikachuHeader />
              <div>
                <h1 style={{ fontFamily: "'Bangers','Impact',cursive", fontSize: "2rem", letterSpacing: "0.06em", background: "linear-gradient(135deg,#FFD700,#FF6B00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, lineHeight: 1.1 }}>
                  ⚡ TourneyManager
                </h1>
                <p style={{ color: muted, fontSize: "0.8rem", margin: "2px 0 0 0" }}>{state.guild.name}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={() => setShowModal(true)} style={{ background: "linear-gradient(135deg,#FFD700,#FF6B00)", border: "none", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#1a1a1a", boxShadow: "0 2px 8px rgba(255,180,0,0.4)" }}>
                <Plus size={15}/> Torneio
              </button>
              <button onClick={() => setDark((d: boolean) => !d)} style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: muted, cursor: "pointer" }}>
                {dark ? <Sun size={16}/> : <Moon size={16}/>}
              </button>
            </div>
          </header>

          {/* Passando o resetSeason para a GuildPage */}
          {tab === "guild"      && <GuildPage state={state} dark={dark} onUpdateGuild={updateGuild} onSetActive={id => { setState(s => ({ ...s, activeTournamentId: id })); setTab("tournament"); }} onNewTournament={() => setShowModal(true)} onDeleteTournament={deleteTournament} onResetSeason={resetSeason} />}
          {tab === "players"    && <PlayersPage players={state.players} dark={dark} onAdd={addPlayer} onRemove={removePlayer} onEdit={editPlayer} />}
          {tab === "tournament" && !activeTournament && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "4rem", marginBottom: "12px" }}>⚔️</div>
              <p style={{ color: muted, fontSize: "1rem", marginBottom: "16px" }}>Nenhum torneio ativo no momento.</p>
              <button onClick={() => setShowModal(true)} style={{ background: "linear-gradient(135deg,#FFD700,#FF6B00)", border: "none", borderRadius: "12px", padding: "12px 24px", cursor: "pointer", fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a" }}>
                Criar Novo Torneio
              </button>
            </div>
          )}
          {tab === "tournament" && activeTournament?.mode === "roundrobin" && (
            <RoundRobinPage tournament={activeTournament} players={state.players} dark={dark} onSetResult={setRRResult} onFinish={finishTournament} />
          )}
          {tab === "tournament" && activeTournament?.mode === "bracket" && (
            <BracketPage tournament={activeTournament} players={state.players} dark={dark} onSetWinner={setBracketWinner} onUnsetWinner={unsetBracketWinner} onFinish={finishTournament} />
          )}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 14px 8px" }}>
            <div style={{ ...T.card(dark), display: "flex", overflow: "hidden", padding: 0 }}>
              {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: "12px 8px", background: active ? (dark ? "rgba(255,215,0,0.1)" : "rgba(204,0,0,0.08)") : "none",
                      border: "none", borderTop: active ? `2px solid ${accent}` : "2px solid transparent",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                      color: active ? accent : muted, fontSize: "0.68rem", fontWeight: active ? 700 : 400, transition: "all 0.15s"
                    }}>
                    {t.icon}
                    <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                    {t.key === "tournament" && activeTournament && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <NewTournamentModal players={state.players} dark={dark} onConfirm={createTournament} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}