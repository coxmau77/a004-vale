const CSS_ID = "opencode-effects-hearts";

// ─── Configuración global del efecto ───
// Cambiá estos valores para ajustar todo el efecto sin tocar el resto del código
const FALL_OPACITY_MIN = 0.15; // ← Opacidad mínima de un corazón cayendo
const FALL_OPACITY_MAX = 0.5; // ← Opacidad máxima de un corazón cayendo
const BURST_OPACITY_START = 0.9; // ← Opacidad inicial de los corazones al explotar
const BURST_OPACITY_MID = 0.6; // ← Opacidad en el punto medio del vuelo
const FLASH_OPACITY = 0.5; // ← (0-1) Intensidad del destello al tocar la pantalla (usando brand-color)
const FLASH_DURATION = 0.35; // ← (s)  Duración del destello
const BURST_SPEED_MIN = 40; // ← (px) Velocidad mínima de la explosión
const BURST_SPEED_MAX = 200; // ← (px) Velocidad máxima de la explosión
const BURST_UPWARD_BIAS = 50; // ← (px) Impulso hacia arriba de la explosión (más alto = más elevación)
const BURST_DELAY = 150; // ← (ms) Retardo entre la primera y segunda explosión

function injectCSS() {
  if (document.querySelector(`[data-effect-css="${CSS_ID}"]`)) return;

  const style = document.createElement("style");
  style.setAttribute("data-effect-css", CSS_ID);
  style.textContent = `
    .heart-particle {
      position: absolute;
      color: var(--brand-color);
      line-height: 1;
      will-change: transform;
      animation: heartsFall linear infinite;
      pointer-events: none;
    }

    @keyframes heartsFall {
      0%   { transform: translateY(-10px)  translateX(0)    rotate(0deg);   opacity: 1; }
      25%  { transform: translateY(25vh)   translateX(-12px) rotate(90deg);  opacity: 0.8; }
      50%  { transform: translateY(50vh)   translateX(8px)   rotate(180deg); opacity: 0.6; }
      75%  { transform: translateY(75vh)   translateX(-16px) rotate(270deg); opacity: 0.4; }
      100% { transform: translateY(calc(100vh + 30px)) translateX(4px) rotate(360deg); opacity: 0.2; }
    }

    @keyframes heartFlash {
      0%   { opacity: ${FLASH_OPACITY}; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createBurstParticle(container, x, y, baseSize, scale) {
  const heart = document.createElement("span");
  heart.textContent = "\u2665";

  const size = (baseSize + random(0, 8)) * scale;
  const angle = random(0, Math.PI * 2);
  const speed = random(BURST_SPEED_MIN, BURST_SPEED_MAX);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed - BURST_UPWARD_BIAS;
  const rotation = random(-360, 360);

  heart.style.cssText = `
    position:absolute;
    left:${x}px;
    top:${y}px;
    font-size:${size}px;
    color:var(--brand-color);
    will-change:transform;
    pointer-events:none;
    line-height:1;
  `;

  heart.animate(
    [
      {
        transform: "translate(0,0) rotate(0deg)",
        opacity: BURST_OPACITY_START,
      },
      {
        transform: `translate(${vx * 0.5}px,${vy * 0.5}px) rotate(${rotation * 0.5}deg)`,
        opacity: BURST_OPACITY_MID,
      },
      {
        transform: `translate(${vx}px,${vy + 80}px) rotate(${rotation}deg)`,
        opacity: 0,
      },
    ],
    {
      duration: 500 + random(0, 600),
      easing: "cubic-bezier(0.2,0.6,0.4,1)",
      fill: "forwards",
    },
  ).onfinish = () => heart.remove();

  container.appendChild(heart);
}

function triggerFlash(container) {
  const flash = document.createElement("div");
  flash.style.cssText = `
    position:absolute;inset:0;z-index:100;
    background:var(--brand-color);opacity:0;pointer-events:none;
    animation:heartFlash ${FLASH_DURATION}s ease-out forwards
  `
    .replace(/\s+/g, " ")
    .trim();
  container.appendChild(flash);
  setTimeout(() => flash.remove(), FLASH_DURATION * 1000 + 50);
}

function triggerBurst(container, x, y) {
  triggerFlash(container);

  for (let i = 0; i < 20; i++) {
    createBurstParticle(container, x, y, 14, 1);
  }

  setTimeout(() => {
    for (let i = 0; i < 15; i++) {
      createBurstParticle(container, x, y, 18, 1.3);
    }
  }, BURST_DELAY);
}

function onPointer(e, container) {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  triggerBurst(container, x, y);
}

export function start(container, config) {
  injectCSS();

  const count = config.intensity || 80;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.textContent = "\u2665";
    heart.className = "heart-particle";
    heart.style.cssText = [
      `left: ${random(0, 100)}%`,
      `font-size: ${random(12, 24)}px`,
      `animation-delay: ${random(0, 4)}s`,
      `animation-duration: ${random(3, 8)}s`,
      `opacity: ${random(FALL_OPACITY_MIN, FALL_OPACITY_MAX)}`,
    ].join(";");
    fragment.appendChild(heart);
  }

  container.appendChild(fragment);

  return {
    cleanup: () => {
      container.replaceChildren();
    },
    onPointer,
  };
}
