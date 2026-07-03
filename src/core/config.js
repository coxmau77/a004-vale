import { content } from "./content.js";

export const appConfig = {
  settings: {
    slideDuration: 5000,       // ← (ms) Tiempo que cada slide permanece visible
    targetFps: 60,             // ← FPS objetivo para monitoreo de rendimiento
    baseColor: "oklch(0.61 0.22 1.81)", // ← Color maestro — todos los colores derivados se generan desde este
  },
  effect: { name: "confetti", intensity: 70 }, // ← nombre: "confetti" | "rain" | ""  |  intensity: 0-100
  content,
};
