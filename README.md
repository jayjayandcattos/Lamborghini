# KotseBroom: Automobili Lamborghini Configurator

A high-end, responsive 3D vehicle configurator and performance statistics visualizer for Lamborghini supercars, built using **React 19**, **Three.js**, **React Three Fiber**, and **Tailwind CSS v4**.

---

## 🚀 Key Features

*   **Interactive 3D Engine:** Leverages React Three Fiber (R3F) and `@react-three/drei` for real-time metallic paint reflections and soft contact shadows.
*   **Dual-Mode Geometry Loader:** Seamlessly detects and loads custom `.glb` vehicle models when placed in the assets directory, or automatically falls back to clean, procedurally generated low-poly geometry.
*   **Live Customization:** Change chassis colors (Giallo Orion, Verde Mantis, Bianco Monocerus, Nero Nemesis) and trigger smooth UI-driven camera transitions (Profile view, Heart V12 engine perspective, Interior view).
*   **Fluid Animations:** Smooth entry states and statistics transitions built with `motion` (Framer Motion).
*   **Modern Premium HUD:** An elegant dark mode interface with glassmorphism overlays showcasing real performance statistics (horsepower, 0–100 km/h acceleration times, top speed).

---

## 🛠️ Technical Stack

*   **Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite 6
*   **Styling:** Tailwind CSS v4 + `@tailwindcss/vite`
*   **3D Graphics:** Three.js + React Three Fiber + `@react-three/drei`
*   **Animations:** Framer Motion (`motion/react`)
*   **Icons:** Lucide React

---

## 📦 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v20+ or v22+ recommended)
*   [npm](https://www.npmjs.com/) (installed automatically with Node.js)

### Installation

1. Clone or copy this project to your desired directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

To run the hot-reloading development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

### Building for Production

To compile and optimize the assets for production deployment:
```bash
npm run build
```
The output files will be generated in the `dist/` directory.

---

## 🎨 Asset Customization

To add high-fidelity 3D models:
1. Create a `public/models/` directory in your workspace root.
2. Drop your `.glb` vehicle models named exactly as follows:
   *   `revuelto.glb` (Lamborghini Revuelto)
   *   `huracan.glb` (Lamborghini Huracán STO)
   *   `aventador.glb` (Lamborghini Aventador SVJ)
3. For details on mapping paint colors to meshes in your GLB, refer to the [GLB Model Integration Guide](GLB_INTEGRATION.md).
