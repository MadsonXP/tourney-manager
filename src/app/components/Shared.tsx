import { useState, useEffect } from "react";
import { fetchSprite } from "./PokemonPicker";

// ─── Theme helpers ────────────────────────────────────────────────────────────
export const T = {
  card: (dark: boolean): React.CSSProperties => ({
    background: dark
      ? "linear-gradient(135deg, rgba(15,20,60,0.88) 0%, rgba(20,15,50,0.92) 100%)"
      : "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,248,220,0.92) 100%)",
    backdropFilter: "blur(14px)",
    border: `1px solid ${dark ? "rgba(255,215,0,0.22)" : "rgba(204,0,0,0.18)"}`,
    borderRadius: "20px",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.12)",
  }),
  accent: (dark: boolean) => dark ? "#FFD700" : "#CC0000",
  text: (dark: boolean) => dark ? "#e2e8f0" : "#1e1206",
  muted: (dark: boolean) => dark ? "#64748b" : "#9b7f6a",
  border: (dark: boolean) => dark ? "rgba(255,215,0,0.15)" : "rgba(204,0,0,0.12)",
  inputBg: (dark: boolean) => dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
  chipBg: (dark: boolean) => dark ? "rgba(255,215,0,0.1)" : "rgba(204,0,0,0.08)",
};

// ─── Pokeball corner ─────────────────────────────────────────────────────────
export function PokeballCorner({ dark, size = 22 }: { dark: boolean; size?: number }) {
  const c = dark ? "#FFD700" : "#CC0000";
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
      <circle cx="14" cy="14" r="12" stroke={c} strokeWidth="2"/>
      <path d="M2,14 A12,12 0 0,1 26,14 Z" fill={c} opacity="0.15"/>
      <line x1="2" y1="14" x2="26" y2="14" stroke={c} strokeWidth="2"/>
      <circle cx="14" cy="14" r="4" fill="none" stroke={c} strokeWidth="2"/>
      <circle cx="14" cy="14" r="2" fill={c} opacity="0.6"/>
    </svg>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ icon, title, dark, right }: { icon: string; title: string; dark: boolean; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 22px", borderBottom: `1px solid ${T.border(dark)}`,
      display: "flex", alignItems: "center", gap: "10px",
      background: dark ? "rgba(255,215,0,0.04)" : "rgba(204,0,0,0.04)"
    }}>
      <PokeballCorner dark={dark} />
      <span style={{ fontSize: "1.15rem" }}>{icon}</span>
      <h2 style={{ color: T.accent(dark), fontFamily: "'Bangers','Impact',cursive", fontSize: "1.25rem", letterSpacing: "0.05em", margin: 0 }}>
        {title}
      </h2>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
      <PokeballCorner dark={dark} />
    </div>
  );
}

// ─── Pokemon sprite ───────────────────────────────────────────────────────────
export function PokemonSprite({ pokeId, size = 40 }: { pokeId: number; size?: number }) {
  const [sprite, setSprite] = useState<string | null>(null);
  useEffect(() => { fetchSprite(pokeId).then(s => { if (s) setSprite(s); }); }, [pokeId]);
  if (!sprite) return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,215,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4 }}>🔴</div>
  );
  return <img src={sprite} alt="" style={{ width: size, height: size, imageRendering: "pixelated", filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.5))", flexShrink: 0 }} />;
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
type BtnProps = { onClick?: () => void; disabled?: boolean; variant?: "primary"|"ghost"|"danger"; children: React.ReactNode; style?: React.CSSProperties; title?: string; };
export function Btn({ onClick, disabled, variant = "primary", children, style, title }: BtnProps) {
  const bg = variant === "primary"
    ? (disabled ? "rgba(100,100,100,0.25)" : "linear-gradient(135deg,#FFD700,#FF6B00)")
    : variant === "danger" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)";
  const color = variant === "primary" ? (disabled ? "#555" : "#1a1a1a") : variant === "danger" ? "#ef4444" : "#94a3b8";
  return (
    <button title={title} disabled={disabled} onClick={onClick} style={{
      background: bg, color, border: variant === "danger" ? "1px solid rgba(239,68,68,0.4)" : "none",
      borderRadius: "10px", padding: "8px 16px", cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: 600,
      boxShadow: variant === "primary" && !disabled ? "0 2px 8px rgba(255,180,0,0.35)" : "none",
      transition: "all 0.15s", flexShrink: 0, ...style
    }}>{children}</button>
  );
}
