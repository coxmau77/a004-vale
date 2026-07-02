import { appConfig } from "../src/core/config.js";

let audioCtx = null;
let currentIndex = 0;

function buildProgressBar() {
  const container = document.getElementById("progress-container");
  container.innerHTML = "";
  appConfig.content.forEach((_, i) => {
    const seg = document.createElement("div");
    seg.className = "progress-segment";
    if (i === 0) seg.classList.add("active");
    container.appendChild(seg);
  });
}

function initAudioContext() {
  try {
    audioCtx = new AudioContext();
    return true;
  } catch {
    console.warn("AudioContext no disponible, modo silencioso");
    return false;
  }
}

async function unlockApp() {
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
}

document.addEventListener("DOMContentLoaded", () => {
  buildProgressBar();
  initAudioContext();

  const splash = document.getElementById("splash-screen");
  splash.showModal();

  const btn = document.getElementById("btn-enter");
  const handleEnter = (e) => {
    e.preventDefault();
    btn.removeEventListener("click", handleEnter);
    btn.removeEventListener("touchstart", handleEnter);
    unlockApp();
  };

  btn.addEventListener("click", handleEnter);
  btn.addEventListener("touchstart", handleEnter, { passive: true });
});
