const CSS_ID = "opencode-effects-confetti";
const hues = [0, 15, 30, 45, 60, 120, 180, 200, 240, 280, 300, 330];

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

function triggerBurst(container, x, y) {
  const count = 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const w = 4 + Math.random() * 4;
    const h = 4 + Math.random() * 4;
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 80;
    const rotation = Math.random() * 720 - 360;

    p.style.cssText = [
      "position:absolute",
      `left:${x}px`,
      `top:${y}px`,
      `width:${w}px`,
      `height:${h}px`,
      `background:hsl(${hue},80%,60%)`,
      `border-radius:${Math.random() > 0.5 ? "2px" : "0"}`,
      "will-change:transform",
      "pointer-events:none",
    ].join(";");

    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${vx * 0.6}px,${vy * 0.6}px) rotate(${rotation * 0.5}deg)`,
          opacity: 0.8,
        },
        {
          transform: `translate(${vx}px,${vy + 60}px) rotate(${rotation}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 600 + Math.random() * 500,
        easing: "cubic-bezier(0.2,0.6,0.4,1)",
        fill: "forwards",
      }
    ).onfinish = () => p.remove();

    container.appendChild(p);
  }
}

function onPointer(e, container) {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  triggerBurst(container, x, y);
}

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
      `opacity: ${0.85 + Math.random() * 0.15}`,
    ].join(";");

    fragment.appendChild(particle);
  }

  container.appendChild(fragment);

  return {
    cleanup: () => {
      container.replaceChildren();
    },
    onPointer,
  };
}
