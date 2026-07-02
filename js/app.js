import { PlayerState } from "../src/core/state.js";

let audioCtx = null;

function initAudioContext() {
  try {
    audioCtx = new AudioContext();
    return true;
  } catch {
    console.warn("AudioContext no disponible, modo silencioso");
    return false;
  }
}

async function unlockApp(state) {
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    console.warn("Fullscreen no disponible, modo ventana");
  }

  if (audioCtx && audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch {
      console.warn("AudioContext no pudo reanudarse");
    }
  }

  const splash = document.getElementById("splash-screen");
  const container = document.getElementById("app-container");

  splash.close();
  container.hidden = false;

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      window.close();
    }
  });

  state.render(0);
}

document.addEventListener("DOMContentLoaded", () => {
  const state = new PlayerState();
  state.init();

  initAudioContext();

  const splash = document.getElementById("splash-screen");
  splash.showModal();

  const btn = document.getElementById("btn-enter");
  const handleEnter = (e) => {
    e.preventDefault();
    btn.removeEventListener("click", handleEnter);
    btn.removeEventListener("touchstart", handleEnter);
    unlockApp(state);
  };

  btn.addEventListener("click", handleEnter);
  btn.addEventListener("touchstart", handleEnter, { passive: true });
});
