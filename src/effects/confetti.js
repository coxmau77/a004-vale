const CSS_ID = "opencode-effects-confetti";

// ─── Paleta de colores ───
// 12 matices distribuidos en el círculo cromático para variedad visual.
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
      animation: confettiFall linear infinite;
    }

    /* ─── Caída con deriva y rotación ───
       La partícula zigzaguea horizontalmente mientras gira 720°
       y pulsa su escala para simular el aleteo de un papel.
       Ajusta translateX (±px) para más/menos deriva.
       Ajusta rotate(deg) para más/menos giros.         */
    @keyframes confettiFall {
      0%   { transform: translateY(0)    translateX(0)    rotate(0deg)   scale(1);   opacity: 1; }
      25%  { transform: translateY(25vh)  translateX(-20px) rotate(180deg) scale(1.15); opacity: 0.9; }
      50%  { transform: translateY(50vh)  translateX(15px)  rotate(360deg) scale(0.85); opacity: 0.8; }
      75%  { transform: translateY(75vh)  translateX(-25px) rotate(540deg) scale(1.1);  opacity: 0.65; }
      100% { transform: translateY(calc(100vh + 20px)) translateX(10px) rotate(720deg) scale(1); opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Ráfaga al tocar la pantalla ───
// Partículas que explotan desde el punto de click y caen con gravedad simulada.
//   count:      cantidad de partículas por toque
//   speed:      60-180px — distancia total del recorrido
//   upwardBias: 80px — impulso inicial hacia arriba (efecto explosión)
//   duration:   600-1100ms — vida de cada partícula antes de autodestruirse
function triggerBurst(container, x, y) {
  const count = 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");

    // Tamaño aleatorio 4-8px
    const w = 4 + Math.random() * 4;
    const h = 4 + Math.random() * 4;

    // Color aleatorio de la paleta
    const hue = hues[Math.floor(Math.random() * hues.length)];

    // Dirección y velocidad (360°, con sesgo ascendente)
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 80;

    // Rotación durante el vuelo
    const rotation = Math.random() * 820 - 360;

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

    // Animación con 3 puntos clave: origen → arco → caída + desvanecer
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
      },
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

// ─── Confeti continuo (efecto de fondo) ───
// Ajusta estos valores para cambiar la lluvia de confeti:
//   count:    cantidad total de partículas (intensity del config)
//   size:     ancho 6-10px, alto 6-10px
//   hue:      color HSL — elige del array hues arriba
//   delay:    0-2s — escalona la salida de cada partícula
//   duration: 3-6s — velocidad de caída (más alto = más lento)
//   opacity:  0.85-1.0 — brillo de cada partícula
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
