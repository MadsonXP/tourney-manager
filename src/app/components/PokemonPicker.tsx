import { useState, useEffect } from "react";

export const POKEMON_OPTIONS = [
  // Kanto
  { id: 3, name: "Venusaur" }, { id: 6, name: "Charizard" }, { id: 9, name: "Blastoise" },
  { id: 25, name: "Pikachu" }, { id: 39, name: "Jigglypuff" }, { id: 59, name: "Arcanine" },
  { id: 65, name: "Alakazam" }, { id: 68, name: "Machamp" }, { id: 76, name: "Golem" },
  { id: 80, name: "Slowbro" }, { id: 89, name: "Muk" }, { id: 94, name: "Gengar" },
  { id: 103, name: "Exeggutor" }, { id: 130, name: "Gyarados" }, { id: 131, name: "Lapras" },
  { id: 133, name: "Eevee" }, { id: 143, name: "Snorlax" }, { id: 144, name: "Articuno" },
  { id: 145, name: "Zapdos" }, { id: 146, name: "Moltres" }, { id: 149, name: "Dragonite" },
  { id: 150, name: "Mewtwo" }, { id: 151, name: "Mew" },

  // Johto
  { id: 154, name: "Meganium" }, { id: 157, name: "Typhlosion" }, { id: 160, name: "Feraligatr" },
  { id: 169, name: "Crobat" }, { id: 181, name: "Ampharos" }, { id: 184, name: "Azumarill" },
  { id: 196, name: "Espeon" }, { id: 197, name: "Umbreon" }, { id: 208, name: "Steelix" },
  { id: 212, name: "Scizor" }, { id: 214, name: "Heracross" }, { id: 227, name: "Skarmory" },
  { id: 230, name: "Kingdra" }, { id: 243, name: "Raikou" }, { id: 244, name: "Entei" },
  { id: 245, name: "Suicune" }, { id: 248, name: "Tyranitar" }, { id: 249, name: "Lugia" },
  { id: 250, name: "Ho-Oh" },

  // Hoenn
  { id: 254, name: "Sceptile" }, { id: 257, name: "Blaziken" }, { id: 260, name: "Swampert" },
  { id: 282, name: "Gardevoir" }, { id: 286, name: "Breloom" }, { id: 302, name: "Sableye" },
  { id: 303, name: "Mawile" }, { id: 306, name: "Aggron" }, { id: 330, name: "Flygon" },
  { id: 334, name: "Altaria" }, { id: 350, name: "Milotic" }, { id: 359, name: "Absol" },
  { id: 373, name: "Salamence" }, { id: 376, name: "Metagross" }, { id: 380, name: "Latias" },
  { id: 381, name: "Latios" }, { id: 382, name: "Kyogre" }, { id: 383, name: "Groudon" },
  { id: 384, name: "Rayquaza" },

  // Sinnoh
  { id: 389, name: "Torterra" }, { id: 392, name: "Infernape" }, { id: 395, name: "Empoleon" },
  { id: 398, name: "Staraptor" }, { id: 405, name: "Luxray" }, { id: 437, name: "Bronzong" },
  { id: 445, name: "Garchomp" }, { id: 448, name: "Lucario" }, { id: 450, name: "Hippowdon" },
  { id: 461, name: "Weavile" }, { id: 468, name: "Togekiss" }, { id: 472, name: "Gliscor" },
  { id: 475, name: "Gallade" }, { id: 478, name: "Froslass" }, { id: 483, name: "Dialga" },
  { id: 484, name: "Palkia" }, { id: 487, name: "Giratina" },

  // Unova
  { id: 497, name: "Serperior" }, { id: 500, name: "Emboar" }, { id: 503, name: "Samurott" },
  { id: 530, name: "Excadrill" }, { id: 553, name: "Krookodile" }, { id: 571, name: "Zoroark" },
  { id: 591, name: "Amoonguss" }, { id: 593, name: "Jellicent" }, { id: 598, name: "Ferrothorn" },
  { id: 609, name: "Chandelure" }, { id: 612, name: "Haxorus" }, { id: 635, name: "Hydreigon" },
  { id: 637, name: "Volcarona" }, { id: 638, name: "Cobalion" }, { id: 639, name: "Terrakion" },
  { id: 641, name: "Tornadus" }, { id: 642, name: "Thundurus" }, { id: 645, name: "Landorus" },
  { id: 646, name: "Kyurem" },

  // Kalos
  { id: 658, name: "Greninja" }, { id: 663, name: "Talonflame" }, { id: 681, name: "Aegislash" },
  { id: 700, name: "Sylveon" }, { id: 701, name: "Hawlucha" }, { id: 706, name: "Goodra" },
  { id: 716, name: "Xerneas" }, { id: 717, name: "Yveltal" },

  // Alola
  { id: 724, name: "Decidueye" }, { id: 727, name: "Incineroar" }, { id: 730, name: "Primarina" },
  { id: 778, name: "Mimikyu" }, { id: 785, name: "Tapu Koko" }, { id: 786, name: "Tapu Lele" },

  // Galar & Paldea
  { id: 812, name: "Rillaboom" }, { id: 815, name: "Cinderace" }, { id: 818, name: "Inteleon" },
  { id: 823, name: "Corviknight" }, { id: 887, name: "Dragapult" }, { id: 906, name: "Meowscarada" },
  { id: 909, name: "Skeledirge" }, { id: 912, name: "Quaquaval" }, { id: 936, name: "Armarouge" },
  { id: 937, name: "Ceruledge" }, { id: 978, name: "Tatsugiri" }, { id: 1000, name: "Gholdengo" }
];

const spriteCache: Record<number, string> = {};

export async function fetchSprite(pokeId: number): Promise<string | null> {
  if (spriteCache[pokeId]) return spriteCache[pokeId];
  try {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
    const data = await r.json();
    const url = data.sprites?.versions?.["generation-v"]?.["black-white"]?.animated?.front_default || data.sprites?.front_default;
    
    if (url) {
      // MÁGICA: Converte a imagem para Base64 para o navegador liberar o download do PNG!
      const imgRes = await fetch(url);
      const blob = await imgRes.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          spriteCache[pokeId] = base64;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch {}
  return null;
}

type Props = { selected: number; onChange: (id: number) => void; darkMode: boolean; };

export function PokemonPicker({ selected, onChange, darkMode }: Props) {
  const [sprites, setSprites] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;
  const pagePokemon = POKEMON_OPTIONS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(POKEMON_OPTIONS.length / PER_PAGE);

  useEffect(() => {
    pagePokemon.forEach(p => { if (!sprites[p.id]) fetchSprite(p.id).then(s => { if (s) setSprites(prev => ({ ...prev, [p.id]: s })); }); });
  }, [page]);

  const accent = darkMode ? "#FFD700" : "#CC0000";
  const borderBase = darkMode ? "rgba(255,215,0,0.15)" : "rgba(204,0,0,0.15)";

  return (
    <div style={{ marginTop: "12px" }}>
      <p style={{ color: darkMode ? "#94a3b8" : "#6b4f3a", fontSize: "0.8rem", marginBottom: "8px" }}>Escolha o Pokémon do treinador:</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {pagePokemon.map(p => {
          const isSel = selected === p.id;
          return (
            <button key={p.id} onClick={() => onChange(p.id)} title={p.name}
              style={{
                background: isSel ? (darkMode ? "rgba(255,215,0,0.2)" : "rgba(204,0,0,0.15)") : (darkMode ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)"),
                border: `2px solid ${isSel ? accent : borderBase}`, borderRadius: "10px", padding: "4px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", transition: "all 0.15s", boxShadow: isSel ? `0 0 10px ${darkMode ? "rgba(255,215,0,0.4)" : "rgba(204,0,0,0.3)"}` : "none", minWidth: "56px"
              }}>
              {sprites[p.id] ? <img src={sprites[p.id]} alt={p.name} style={{ width: 36, height: 36, imageRendering: "pixelated" }} /> : <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🔴</div>}
              <span style={{ fontSize: "0.6rem", color: isSel ? accent : darkMode ? "#94a3b8" : "#6b4f3a", fontWeight: isSel ? 700 : 400 }}>{p.name}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: "none", border: `1px solid ${borderBase}`, borderRadius: "8px", color: accent, padding: "4px 10px", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, fontSize: "0.8rem" }}>← Anterior</button>
        <span style={{ fontSize: "0.75rem", color: darkMode ? "#64748b" : "#9b7f6a" }}>{page + 1}/{totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ background: "none", border: `1px solid ${borderBase}`, borderRadius: "8px", color: accent, padding: "4px 10px", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1, fontSize: "0.8rem" }}>Próximo →</button>
      </div>
    </div>
  );
}