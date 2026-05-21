import { useState } from "react";
import { UserPlus, X, Pencil, Check, Trophy, Swords } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Player } from "../store";
import { T, SectionHeader, PokemonSprite, Btn } from "../components/Shared";
import { PokemonPicker, POKEMON_OPTIONS, fetchSprite } from "../components/PokemonPicker";
import { useEffect } from "react";

type Props = {
  players: Player[];
  dark: boolean;
  onAdd: (nick: string, pokeId: number) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, nick: string, pokeId: number) => void;
};

function PlayerCard({ player, dark, onRemove, onEdit }: { player: Player; dark: boolean; onRemove: () => void; onEdit: (nick: string, pokeId: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [editNick, setEditNick] = useState(player.nick);
  const [editPoke, setEditPoke] = useState(player.pokeId);
  const [showPicker, setShowPicker] = useState(false);
  const [previewSprite, setPreviewSprite] = useState<string | null>(null);

  useEffect(() => { fetchSprite(editPoke).then(s => { if (s) setPreviewSprite(s); }); }, [editPoke]);

  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  const save = () => {
    if (!editNick.trim()) return;
    onEdit(editNick.trim(), editPoke);
    setEditing(false);
    setShowPicker(false);
  };

  const cancel = () => {
    setEditNick(player.nick);
    setEditPoke(player.pokeId);
    setEditing(false);
    setShowPicker(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${editing ? accent : border}`,
        borderRadius: "14px", padding: "12px 14px",
        transition: "border-color 0.2s",
        boxShadow: editing ? `0 0 12px ${dark ? "rgba(255,215,0,0.2)" : "rgba(204,0,0,0.15)"}` : "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Pokemon sprite / edit button */}
        {editing ? (
          <button onClick={() => setShowPicker(v => !v)} title="Trocar Pokémon"
            style={{ background: showPicker ? (dark ? "rgba(255,215,0,0.15)" : "rgba(204,0,0,0.1)") : "none", border: `2px solid ${showPicker ? accent : border}`, borderRadius: "10px", padding: "2px", cursor: "pointer", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {previewSprite ? <img src={previewSprite} alt="" style={{ width: 40, height: 40, imageRendering: "pixelated" }} /> : <span>🔴</span>}
          </button>
        ) : (
          <PokemonSprite pokeId={player.pokeId} size={44} />
        )}

        {/* Nick */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={editNick}
              onChange={e => setEditNick(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
              style={{ background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "8px", padding: "6px 10px", fontSize: "0.9rem", outline: "none", width: "100%" }}
            />
          ) : (
            <div style={{ color: text, fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.nick}</div>
          )}
          <div style={{ color: muted, fontSize: "0.72rem", marginTop: "3px", display: "flex", gap: "10px" }}>
            <span>⚔️ {player.totalWins}V / {player.totalLosses}D</span>
            {player.titles > 0 && <span style={{ color: "#FFD700" }}>🏆 {player.titles} título{player.titles > 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {editing ? (
            <>
              <button onClick={save} title="Salvar"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                <Check size={14}/>
              </button>
              <button onClick={cancel} title="Cancelar"
                style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                <X size={14}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditNick(player.nick); setEditPoke(player.pokeId); setEditing(true); }} title="Editar"
                style={{ background: "none", border: `1px solid ${border}`, color: muted, borderRadius: "8px", padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                <Pencil size={14}/>
              </button>
              <button onClick={onRemove} title="Remover"
                style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", display: "flex" }}>
                <X size={14}/>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Pokemon picker */}
      <AnimatePresence>
        {editing && showPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: "10px", background: dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)", border: `1px solid ${border}`, borderRadius: "12px", padding: "10px" }}>
              <PokemonPicker selected={editPoke} onChange={id => { setEditPoke(id); setShowPicker(false); }} darkMode={dark} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PlayersPage({ players, dark, onAdd, onRemove, onEdit }: Props) {
  const [nick, setNick] = useState("");
  const [selectedPoke, setSelectedPoke] = useState(POKEMON_OPTIONS[0].id);
  const [showPicker, setShowPicker] = useState(false);
  const [previewSprite, setPreviewSprite] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchSprite(selectedPoke).then(s => { if (s) setPreviewSprite(s); }); }, [selectedPoke]);

  const accent = T.accent(dark);
  const muted  = T.muted(dark);
  const text   = T.text(dark);
  const border = T.border(dark);

  const handleAdd = () => {
    const t = nick.trim();
    if (!t) return;
    if (players.some(p => p.nick.toLowerCase() === t.toLowerCase())) { setError("Nick já cadastrado!"); return; }
    onAdd(t, selectedPoke);
    setNick(""); setError("");
  };

  const filtered = players.filter(p => p.nick.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...filtered].sort((a, b) => (b.titles - a.titles) || (b.totalWins - a.totalWins));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Add form */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader icon="🎮" title="Cadastro de Treinadores" dark={dark} />
        <div style={{ padding: "18px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: error ? "6px" : "0" }}>
            <button onClick={() => setShowPicker(v => !v)} title="Escolher Pokémon"
              style={{ background: showPicker ? (dark ? "rgba(255,215,0,0.15)" : "rgba(204,0,0,0.1)") : T.chipBg(dark), border: `2px solid ${showPicker ? accent : border}`, borderRadius: "12px", width: 52, height: 52, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {previewSprite ? <img src={previewSprite} alt="" style={{ width: 40, height: 40, imageRendering: "pixelated" }} /> : <span style={{ fontSize: "1.4rem" }}>🔴</span>}
            </button>
            <input value={nick} onChange={e => { setNick(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Nick do treinador..."
              style={{ flex: 1, background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "12px", padding: "10px 14px", outline: "none", fontSize: "0.95rem" }}
            />
            <Btn onClick={handleAdd} disabled={!nick.trim()}><UserPlus size={15}/> Adicionar</Btn>
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "4px 0 0 0" }}>{error}</p>}

          <AnimatePresence>
            {showPicker && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ marginTop: "12px", background: dark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)", border: `1px solid ${border}`, borderRadius: "14px", padding: "12px" }}>
                  <PokemonPicker selected={selectedPoke} onChange={id => { setSelectedPoke(id); setShowPicker(false); }} darkMode={dark} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Player list */}
      <div style={{ ...T.card(dark), overflow: "hidden" }}>
        <SectionHeader icon="👥" title={`Treinadores (${players.length})`} dark={dark} />
        <div style={{ padding: "14px 16px" }}>
          {players.length > 4 && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Buscar treinador..."
              style={{ width: "100%", background: T.inputBg(dark), border: `1px solid ${border}`, color: text, borderRadius: "10px", padding: "8px 12px", outline: "none", fontSize: "0.85rem", marginBottom: "12px", boxSizing: "border-box" }}
            />
          )}
          {sorted.length === 0 ? (
            <p style={{ color: muted, textAlign: "center", padding: "20px 0", margin: 0 }}>Nenhum treinador encontrado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <AnimatePresence>
                {sorted.map(p => (
                  <PlayerCard key={p.id} player={p} dark={dark}
                    onRemove={() => onRemove(p.id)}
                    onEdit={(nick, pokeId) => onEdit(p.id, nick, pokeId)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
