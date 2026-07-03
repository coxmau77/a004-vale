const CSS_ID = "opencode-effects-rain";

function injectCSS() {
  if (document.querySelector(`[data-effect-css="${CSS_ID}"]`)) return;

  const style = document.createElement("style");
  style.setAttribute("data-effect-css", CSS_ID);
  style.textContent = `
    /* ─── Gota de lluvia ───
       width: 2px          → ancho de la gota
       height: 15px        → largo de la gota
       rgba(180,210,255,.5) → color de la gota (azul claro)
                                    */
    .rain-particle {
      position: absolute;
      top: -15px;
      width: 2px;
      height: 15px;
      background: linear-gradient(transparent, rgba(180, 210, 255, 0.5));
      animation: rainFall linear infinite;
      will-change: transform;
    }

    @keyframes rainFall {
      0%   { transform: translateY(0); }
      100% { transform: translateY(calc(100vh + 20px)); }
    }
  `;
  document.head.appendChild(style);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

export function start(container, config) {
  injectCSS();

  const count = config.intensity || 80;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-particle";
    drop.style.left = `${random(0, 100)}%`;           // ← Posición horizontal aleatoria (0-100%)
    drop.style.animationDelay = `${random(0, 3)}s`;   // ← (s) Retardo antes de empezar a caer
    drop.style.animationDuration = `${random(0.4, 1.0)}s`; // ← (s) Velocidad de caída (menor = más rápido)
    drop.style.opacity = `${random(0.3, 0.7)}`;       // ← Opacidad de cada gota (0-1)
    fragment.appendChild(drop);
  }

  container.appendChild(fragment);

  return {
    cleanup: () => { container.replaceChildren(); },
  };
}
