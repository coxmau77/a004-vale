# ESPECIFICACIÓN TÉCNICA DE ARQUITECTURA

## PROYECTO: ANIMAME.AR (CORE ENGINE)

---

### 1. OBJETIVO DEL PRODUCTO Y ALCANCE

#### 1.1 Objetivo del Producto

**animame.ar** es un reproductor de historias en formato 9:16, client-side, mobile-first, que renderiza secuencias multimedia a partir de una configuración JSON hardcodeada. Utiliza APIs nativas del navegador para reproducción de medios, efectos visuales acelerados por GPU mediante CSS, y loop infinito de slides.

#### 1.2 Alcance Técnico

- **Dentro del Alcance:**
  - Arquitectura data-driven con renderizado dinámico del DOM.
  - Motor de efectos visuales desacoplado (partículas nativas + física delegada a GPU mediante hojas de estilo dinámicas).
  - Layout responsive con `max-width: 720px` centrado, adaptable al viewport del dispositivo.
  - Loop infinito al alcanzar el último slide.
  - Manejo de errores centralizado para fallos de red, medios y APIs.
  - Precarga activa de recursos N+1 y lazy loading para recursos distantes.
  - Despliegue en Netlify.

- **Fuera del Alcance:**
  - Interfaces WYSIWYG de edición de contenido.
  - Persistencia en bases de datos o procesamiento server-side (SSR/Edge).
  - Frameworks o librerías externas de animación (React, Vue, GSAP, Anime.js, Tailwind, Bootstrap).
  - Build steps, bundlers o transpilación.
  - Service Workers o estrategias de caché persistentes.
  - Navegación por teclado.
  - Pantalla de splash o barrera de interacción inicial.
  - Fullscreen API.

---

### 2. STACK TECNOLÓGICO

Filosofía _Web Platform First_: 100% de las funcionalidades se construyen con APIs nativas estándar del navegador.

- **Estructura:** HTML5 semántico puro (`<video>`, `<audio>`, `<template>`).
- **Estilos y Física Visual:** CSS moderno con Custom Properties, espacio de color `oklch()`, función `color-mix()`, `@keyframes`, y motor de composición acelerado por hardware (GPU). Unidades `dvh` para viewport dinámico.
- **Lógica y Orquestación:** Vanilla JavaScript (ES Modules). Uso de `requestAnimationFrame` y `DocumentFragment`.
- **Entorno:** Cualquier navegador que implemente nativamente HTML5, CSS moderno (oklch, color-mix, dvh) y ES Modules. Sin dependencia de versiones específicas de navegador.

---

### 3. ARQUITECTURA Y MODELO DE DATOS

La interfaz es función directa del estado definido en `appConfig`. Prohibida la mutación manual de `index.html` para alterar el flujo o contenido. Toda la verdad del sistema reside en la configuración JavaScript hardcodeada.

```javascript
// src/core/config.js
export const appConfig = {
  settings: {
    slideDuration: 5000,
    targetFps: 60,
    enableSwipe: true,
    baseColor: "oklch(55% 0.22 260)",
  },
  content: [
    {
      id: 1,
      type: "image",
      src: "./assets/img/Istory%20-%201.jpg",
      alt: "Istory - 1",
    },
  ],
};
```

---

### 4. ORGANIZACIÓN DE CARPETAS

```
animame.ar/
│
├── index.html                 # Cascarón semántico estático (puntos de montaje)
├── README.md                  # Control operacional del repositorio
│
├── docs/
│   └── spec.md                # Este contrato técnico de arquitectura
│
├── css/
│   └── styles.css             # Estilos globales, normalización y layout base
│
├── js/
│   └── app.js                 # Punto de entrada y bootstrapping
│
├── src/
│   ├── core/                  # Núcleo de la aplicación
│   │   ├── state.js           # Máquina de estados del reproductor
│   │   └── config.js          # Objeto appConfig
│   │
│   ├── effects/               # Módulos del motor de efectos
│   │   ├── index.js           # EffectsManager (registro + ciclo de vida)
│   │   ├── rain.js            # Lluvia (lógica + inyección CSS vía injectCSS)
│   │   ├── confetti.js        # Confeti (lógica + inyección CSS vía injectCSS)
│   │
│   └── ui/                    # Componentes de interacción
│       ├── progress.js        # Barra de progreso fraccionada
│       └── controls.js        # Gestos táctiles y navegación
│
└── assets/
    ├── img/                   # Imágenes y posters de video (WebP)
    ├── video/                 # Clips de video (H.264/MP4)
    └── audio/                 # Bucles de audio de efectos (MP3)
```

---

### 5. CONVENCIONES DE CÓDIGO

- **Separación de Capas:**
  - **HTML:** Solo estructura semántica y mount points con atributos ARIA iniciales.
  - **CSS:** Control absoluto de layouts, tokens visuales y físicas mediante `@keyframes`. Prohibido escribir estilos imperativos en JavaScript. La interacción se limita a `element.style.setProperty` para variables CSS.
  - **JavaScript:** Lógica de negocio, estados internos, orquestación temporal e instanciación/destrucción de nodos DOM.

- **Nomenclatura:**
  - Archivos y carpetas: `kebab-case`
  - Variables y funciones JS: `camelCase`
  - Clases CSS: BEM modificado o selectores semánticos sobre IDs estructurales (`#media-container`, `#progress-container`)

---

### 6. MÁQUINA DE ESTADOS (LIFECYCLE)

La aplicación se comporta como una máquina de estados finitos con las siguientes fases:

```
[ Init ] --> [ Render State ] --> [ Next / Loop ]
```

#### 6.1 Init (Inicialización)

Carga de `appConfig`, lectura analítica del array `content`, y construcción dinámica de la barra de progreso con segmentos proporcionales al número total de elementos.

#### 6.2 Render State

Evaluador condicional según `type` del slide:

- **`image`:** Inyección del nodo `<img>`, activación del motor de efectos, arranque de temporizador (`setTimeout`) sincronizado con la barra de progreso.
- **`video`:** Suspensión del reloj global. Inyección de `<video>` con atributo `poster`. Captura del evento `ended` para avanzar al siguiente estado.

La transición entre slides se realiza mediante crossfade: el elemento anterior permanece en el DOM mientras se desvanece (`opacity: 1 → 0`) y el nuevo elemento aparece (`opacity: 0 → 1`) simultáneamente, utilizando `transition: opacity 0.5s` delegado al compositor GPU. Tras completarse la transición (500ms), el elemento anterior se elimina del DOM. En navegación rápida (prev/next), los elementos obsoletos se limpian inmediatamente para evitar acumulación.

#### 6.3 Precarga Activa (Preloading)

Durante el slide `N`, el motor instancia en segundo plano (`new Image()`) el recurso `N + 1` para resolver caché antes de su uso. Para recursos distantes (> N+1), se aplica lazy loading nativo:
- `<img loading="lazy">`
- `<video preload="none">` o `preload="metadata"`

#### 6.4 Loop Infinito

Al llegar al último slide (`index === content.length - 1`), la transición reinicia desde el índice 0. La barra de progreso se reinicia.

---

### 7. MOTOR DE EFECTOS (EFFECTS ENGINE)

#### 7.1 Generación Eficiente en DOM

Prohibido el recalculo de estilos o inserción iterativa directa en el DOM principal. JavaScript opera como emisor de partículas efímeras instanciadas dentro de un `DocumentFragment`.

#### 7.2 Inyección y Enlace de Estilos

Cada módulo de efecto inyecta su propia hoja de estilos vía `<style data-effect-css="...">` en `<head>` la primera vez que se activa (función `injectCSS()`). Las partículas reciben parámetros dinámicos mediante propiedades de estilo directas (posición, delay, duración, opacidad). El fragmento completo se inserta en una transacción atómica en el contenedor del DOM.

#### 7.3 Delegación de Física a GPU

Toda la lógica transicional (gravedad, turbulencia, rotación, opacidad, desplazamiento) se delega al compositor CSS mediante propiedades aceleradas por hardware: `transform: translate3d(), rotate(), scale()` y `opacity`.

#### 7.4 Recolección Automática

Para efectos continuos (loop infinito), la limpieza se delega al `cleanup` del módulo (`container.replaceChildren()`) cuando el motor cambia o detiene el efecto. Efectos de tipo ráfaga podrían usar `animationend` para autodestrucción por partícula.

#### 7.5 Efecto Inválido

Si `effect.name` no corresponde a ningún módulo cargado en `/src/effects/`, el motor omite la inyección sin interrumpir el flujo del reproductor.

---

### 8. ESTRATEGIA DE CSS Y DESIGN SYSTEM

#### 8.1 Layout y Proporciones

- `html, body { overflow: hidden }` para anular scroll.
- `height: 100dvh` para neutralizar barras dinámicas de navegadores móviles.
- `#app-container` con `max-width: 720px; margin: 0 auto` para centrado en pantallas grandes y adaptación automática en viewports menores.
- Transición crossfade de 0.5s entre slides mediante `transition: opacity` acelerada por GPU, con `cubic-bezier(0.4, 0, 0.2, 1)` como función de temporización.
- Capas en posición absoluta con `z-index` explícito: Fondo Multimedia < Partículas < Controles.

#### 8.2 Sistema Cromático (Design Tokens)

La paleta de colores se deriva de un único token cromático maestro definido en `appConfig.settings.baseColor` bajo el estándar `oklch()`. Todos los colores derivados se calculan con `color-mix(in oklch, ...)`.

```css
:root {
  --brand-color: oklch(55% 0.22 260);
  --bg-dark: color-mix(in oklch, var(--brand-color) 10%, black);
  --text-light: color-mix(in oklch, var(--brand-color) 10%, white);
  --progress-bar-bg: color-mix(in oklch, var(--text-light) 30%, transparent);
  --progress-bar-active: var(--brand-color);
  --timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

### 9. ESTRATEGIA DE PERFORMANCE

#### 9.1 Propiedades Seguras de Animación

Solo se permite animar `transform` y `opacity` dentro de `@keyframes`, evitando fases de Layout y Paint.

#### 9.2 Eventos Táctiles

Todos los touch listeners (`touchstart`, `touchmove`) se configuran con `{ passive: true }`.

#### 9.3 FPS Configurable

El target de FPS se define en `appConfig.settings.targetFps` (valor por defecto: 60). La evaluación de rendimiento se realiza contra este valor configurable. `requestAnimationFrame` se adapta al refresh rate del dispositivo.

---

### 10. LAZY LOADING Y ESTRATEGIA DE RED

- **Precarga N+1:** Durante el slide N, se precarga en memoria el recurso N+1.
- **Lazy loading nativo:** Recursos con índice > N+1 usan `loading="lazy"` en `<img>` y `preload="metadata"` en `<video>`.
- **Fallback de red:** Si la precarga de N+1 falla, el reproductor continúa con el slide actual sin precarga y reintenta en el siguiente ciclo.

---

### 11. MANEJO DE ERRORES

Mecanismo centralizado, modular y escalable para garantizar que ningún fallo externo interrumpa la experiencia.

#### 11.1 Imagen
- Evento `onerror` en `<img>`: insertar placeholder visual genérico, registrar error en consola, no interrumpir el flujo.

#### 11.2 Video
- Evento `onerror` o `onabort` en `<video>`: saltar al siguiente slide automáticamente.

#### 11.3 appConfig Malformado
- Si `appConfig` no puede evaluarse o su estructura es inválida: renderizar pantalla de error estático con mensaje legible.

#### 11.4 Efecto Inválido
- Si `effect.name` no existe en el motor: omitir el efecto, continuar con el slide.

---

### 12. ACCESIBILIDAD

- `#app-container` implementa `aria-live="polite"` para notificar cambios de slide.
- Controles táctiles invisibles (`#touch-prev`, `#touch-next`) incluyen `aria-label`.
- El motor de efectos respeta `@media (prefers-reduced-motion: reduce)` reduciendo o anulando animaciones de partículas.

La aplicación está diseñada exclusivamente para interacción táctil en dispositivos móviles. No se implementa navegación por teclado.

---

### 13. ESTRATEGIA DE CACHÉ

- Sin Service Worker ni Cache API.
- Encabezados HTTP configurados en Netlify para `Cache-Control: no-cache` o `must-revalidate`.
- La única precarga permitida es la precarga en memoria N+1 desde JavaScript.

---

### 14. CRITERIOS DE ACEPTACIÓN TÉCNICA

1. **Cero dependencias:** Sin referencias a librerías externas JS o CSS.
2. **Rendimiento:** Renderizado estable al target definido en `appConfig.settings.targetFps` en dispositivos móviles de gama media.
3. **Manejo de errores:** Ningún fallo individual (imagen rota, video corrupto, API bloqueada) debe interrumpir la ejecución del reproductor.

---

### 15. ROADMAP TÉCNICO

#### Hito 1: Arquitectura Base (Reproductor Inmediato)
- Estructura física del proyecto.
- `index.html` con puntos de montaje.
- `styles.css` con variables oklch, layout responsive (`max-width: 720px`, centrado).
- Bootstrap de JavaScript y carga de `appConfig`.
- Barra de progreso, controles táctiles, navegación cíclica.
- Transición crossfade entre slides (0.5s, GPU-accelerada).
- **Criterio:** La app carga y muestra el primer slide inmediatamente, responsive, centrado a max 720px, con transiciones suaves entre slides sin parpadeos ni cortes.

#### Hito 2: Motor de Efectos y Precarga ✅
- Módulo genérico de efectos basado en `DocumentFragment` con inyección CSS dinámica.
- Efecto lluvia (rain) con física CSS.
- Efecto confeti (confetti) con física CSS.
- Integración del EffectsManager en `PlayerState.render()` y `PlayerState.destroy()`.
- Precarga N+1 y N+2 en memoria.
- **Criterio:** Efectos visuales superpuestos sin degradación de FPS. Precarga funcional. Efecto inválido se omite sin error.

#### Hito 3: Audio Dual y Afinación de Performance
- Integración de Web Audio API con bucles ambientales (requiere interacción del usuario para activación).
- Reducción de volumen ambiental durante reproducción de video.
- Sistema de FPS configurable y monitoreo básico.
- Soporte para `prefers-reduced-motion`.
- **Criterio:** Audio ambiental sincronizado con efectos, reducción automática al 40% durante video con audio.

---

Este documento constituye el contrato técnico definitivo de arquitectura para **animame.ar**.
