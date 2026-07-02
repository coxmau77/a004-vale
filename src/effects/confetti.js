const CSS_ID = "opencode-effects-confetti";

function injectCSS() {
  if (document.querySelector(`[data-effect-css="${CSS_ID}"]`)) return;

  const style = document.createElement("style");
  style.setAttribute("data-effect-css", CSS_ID);
  style.textContent = `
    .confetti-particle {
      position: absolute;
      top: -10px;
      will-change: transform;
      animation: confettiFall ease-in infinite;
    }

    @keyframes confettiFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(calc(100vh + 20px)) rotate(360deg);
        opacity: 0.5;
      }
    }
  `;
  document.head.appendChild(style);
}

const hues = [0, 15, 30, 45, 60, 120, 180, 200, 240, 280, 300, 330];

export function start(container, config) {
  injectCSS();

  const count = config.intensity || 120;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";

    const w = 6 + Math.random() * 4;
    const h = 6 + Math.random() * 4;
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const light = 50 + Math.random() * 20;
    const saturation = 70 + Math.random() * 20;

    particle.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `width: ${w}px`,
      `height: ${h}px`,
      `background: hsl(${hue}, ${saturation}%, ${light}%)`,
      `border-radius: ${Math.random() > 0.5 ? "2px" : "0"}`,
      `animation-delay: ${Math.random() * 2}s`,
      `animation-duration: ${3 + Math.random() * 3}s`,
      `opacity: ${0.5 + Math.random() * 0.1}`,
    ].join(";");

    fragment.appendChild(particle);
  }

  container.appendChild(fragment);

  return {
    cleanup: () => {
      container.replaceChildren();
    },
  };
}
