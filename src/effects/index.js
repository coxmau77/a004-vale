import { start as rain } from "./rain.js";
import { start as confetti } from "./confetti.js";

const registry = { rain, confetti };
let cleanup = null;

export function startEffect(container, config) {
  stopEffect();

  if (!config || !config.name) return;

  const module = registry[config.name];
  if (!module) {
    console.warn(`Efecto desconocido: "${config.name}"`);
    return;
  }

  const result = module(container, config);
  cleanup = result.cleanup || null;
}

export function stopEffect() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
