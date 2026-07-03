import { content } from "./content.js";

export const appConfig = {
  settings: {
    slideDuration: 5000,
    targetFps: 60,
    baseColor: "oklch(0.61 0.22 1.81)",
  },
  effect: { name: "confetti", intensity: 70 },
  content,
};
