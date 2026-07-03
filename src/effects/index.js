import { start as rain } from "./rain.js";
import { start as hearts } from "./hearts.js";

const registry = { rain, hearts };
let cleanup = null;
let pointerHandler = null;

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
  pointerHandler = result.onPointer || null;
}

export function handlePointer(e, container) {
  if (pointerHandler) {
    pointerHandler(e, container);
  }
}

export function stopEffect() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  pointerHandler = null;
}
