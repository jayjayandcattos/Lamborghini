# KotseBroom: Automobili Lamborghini Configurator

A 3D supercar configurator built to look and feel like an official **three.js example page** — warm
paper, blueprint grid, hairline rules, a docs sidebar and a live inspector — rather than a generic
dark-mode "luxury" HUD.

---

## 🚀 Key Features

- **three.js-style chrome:** a docs sidebar of "examples" that double as scene toggles, an inspector
  panel with live object/material/camera properties, a syntax-highlighted code readout that rewrites
  itself from state, and a status bar reporting real FPS / triangle / draw-call counts.
- **Interactive 3D engine:** React Three Fiber + `@react-three/drei` with a lightformer studio
  environment, infinite measurement grid, soft contact shadows and orbit/zoom controls.
- **Real paint tinting:** each GLB's body-paint material is matched by name and re-tinted, so the
  swatches genuinely repaint the car (and re-tint the whole UI accent).
- **Scene flags:** wireframe, grid, contact shadows and auto-rotate are all switchable — from the
  sidebar, the inspector, or the keyboard.
- **Dual-mode geometry loader:** merges ~1,500 mesh nodes down to a couple dozen draw calls, with a
  procedural wireframe fallback if a model is missing.
- **Motion:** GSAP timelines for the preloader, per-character title reveals and panel transitions;
  AOS for the entrance choreography. Both fully respect `prefers-reduced-motion`.
- **Export:** the header button downloads the current configuration as JSON.

---

## 🛠️ Technical Stack

- **Framework:** React 19 (TypeScript)
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4 + `@tailwindcss/vite`, custom design tokens in `src/index.css`
- **3D:** Three.js + React Three Fiber + `@react-three/drei`
- **Animation:** GSAP 3 + AOS 2
- **Icons:** Lucide React

---

## ⌨️ Shortcuts

| Key | Action |
| --- | --- |
| `←` / `→` | Previous / next chassis |
| `1` – `4` | Front, profile, rear, interior camera |
| `W` | Toggle wireframe |
| `G` | Toggle grid |
| `R` | Toggle auto-rotate |
| `Esc` | Close the mobile drawer |

---

## 📦 Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle in dist/
npm run lint     # tsc --noEmit
```

---

## 🎨 Asset Customization

1. Create a `public/models/` directory in your workspace root.
2. Drop your `.glb` vehicle models in, named exactly:
   - `aventador.glb`, `huracan.glb`, `gallardo.glb`, `urus.glb`
3. Add a matching entry to `src/data/models.ts`. The `paintMaterial` field is the substring used to
   find the body-paint material inside the GLB (for example `2020Paint_Material`), and
   `paintRoughness` / `paintMetalness` are applied to it on selection.
