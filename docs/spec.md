# ESPECIFICACIÓN TÉCNICA DE ARQUITECTURA

## PROYECTO: ANIMAME.AR (CORE ENGINE)

---

### 1. OBJETIVO DEL PRODUCTO Y ALCANCE

#### 1.1 Objetivo del Producto

**animame.ar** es un reproductor de historias en formato 9:16, client-side, mobile-first, que renderiza secuencias multimedia a partir de una configuración JSON hardcodeada. Utiliza APIs nativas del navegador para reproducción de medios, efectos visuales acelerados por GPU mediante CSS, y sincronización de audio ambiental con sonido de video.

#### 1.2 Alcance Técnico

- **Dentro del Alcance:**
  - Arquitectura data-driven con renderizado dinámico del DOM.
  - Motor de efectos visuales desacoplado (partículas nativas + física delegada a GPU mediante hojas de estilo dinámicas).
  - Gestión de ciclo de vida multimedia con bypass de autoplay mediante barrera de interacción (`<dialog>`).
  - Persistencia y sincronización de bucles de audio ambiental (seamless loops) asociados a efectos climáticos/ornamentales.
  - Audio dual: reducción automática del volumen ambiental al 60% cuando un video con pista de audio está en reproducción.
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

---

### 2. STACK TECNOLÓGICO

Filosofía _Web Platform First_: 100% de las funcionalidades se construyen con APIs nativas estándar del navegador.

- **Estructura:** HTML5 semántico puro (`<dialog>`, `<video>`, `<audio>`, `<template>`).
- **Estilos y Física Visual:** CSS moderno con Custom Properties, espacio de color `oklch()`, función `color-mix()`, `@keyframes`, y motor de composición acelerado por hardware (GPU). Unidades `dvh` para viewport dinámico.
- **Lógica y Orquestación:** Vanilla JavaScript (ES Modules). Uso de `requestAnimationFrame`, `DocumentFragment`, Web Audio API y Fullscreen API.
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
    baseColor: "oklch(0.6 0.2 250)",
    ambientAudioEnabled: true,
    ambientToVideoAudioRatio: 0.4,
  },
  content: [
    {
      id: 1,
      type: "image",
      src: "./assets/img/slide1.webp",
      alt: "Escena de introducción histórica",
      effect: {
        name: "rain",
        intensity: 80,
        audioSrc: "./assets/audio/rain-loop.mp3",
      },
    },
    {
      id: 2,
      type: "video",
      src: "./assets/video/escena2.mp4",
      poster: "./assets/img/poster2.webp",
      autoplay: false,
      hasAudioTrack: true,
      effect: {
        name: "confetti",
        intensity: 120,
      },
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
│   │   ├── config.js          # Objeto appConfig
│   │   └── audio.js           # Orquestador Web Audio API
│   │
│   ├── effects/               # Módulos del motor de efectos
│   │   ├── rain.js            # Lógica de partículas de lluvia
│   │   ├── rain.css           # Física y @keyframes de lluvia
│   │   ├── confetti.js        # Lógica de partículas de confeti
│   │   └── confetti.css       # @keyframes acelerados de confeti
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
[ Init ] --> [ Unlock ] --> [ Render State ] --> [ Interrupción ]
                                                    |
                                                    v
                                              [ Next / Loop ]
```

#### 6.1 Init (Inicialización)

Carga de `appConfig`, lectura analítica del array `content`, y construcción dinámica de la barra de progreso con segmentos proporcionales al número total de elementos.

#### 6.2 Unlock (Puerta de Entrada)

Se muestra un `<dialog id="splash-screen">`. Al capturar `click`/`touchstart` en `#btn-enter` se ejecuta en paralelo:

- `document.documentElement.requestFullscreen()`. Si falla, se continua en modo ventana.
- Desbloqueo e instanciación del `AudioContext` global. Si falla, se opera en modo silencioso.
- Ocultamiento del `dialog` y remoción de `hidden` en `#app-container`.

Si el usuario sale de fullscreen manualmente (`fullscreenchange`), se ejecuta `window.close()` para cerrar la pestaña.

#### 6.3 Render State

Evaluador condicional según `type` del slide:

- **`image`:** Inyección del nodo `<img>`, activación del motor de efectos, arranque de temporizador (`setTimeout`) sincronizado con la barra de progreso.
- **`video`:** Suspensión del reloj global. Inyección de `<video>` con atributo `poster`. Captura del evento `ended` para avanzar al siguiente estado.

#### 6.4 Precarga Activa (Preloading)

Durante el slide `N`, el motor instancia en segundo plano (`new Image()`) el recurso `N + 1` para resolver caché antes de su uso. Para recursos distantes (> N+1), se aplica lazy loading nativo:
- `<img loading="lazy">`
- `<video preload="none">` o `preload="metadata"`

#### 6.5 Loop Infinito

Al llegar al último slide (`index === content.length - 1`), la transición reinicia desde el índice 0. La barra de progreso se reinicia. El audio ambiental continúa sin interrupción.

---

### 7. GESTIÓN DE AUDIO

#### 7.1 Audio Ambiental

El `AudioContext` global gestiona bucles de fondo asociados a efectos climáticos u ornamentales. Se instancia tras el desbloqueo y permanece activo durante todo el ciclo de vida.

#### 7.2 Audio Dual (Ambiental + Video)

Cuando un slide tipo `video` se reproduce y `hasAudioTrack: true`:
1. El volumen del audio ambiental se reduce al 40% del nivel actual (reducción del 60%).
2. Al dispararse el evento `ended` del video, el volumen ambiental se restaura al 100%.
3. Si `hasAudioTrack: false`, no se modifica el volumen ambiental.

```javascript
// Ejemplo conceptual
if (slide.type === "video" && slide.hasAudioTrack) {
  ambientGain.gain.value = ambientGain.gain.value * 0.4;
  videoElement.onended = () => {
    ambientGain.gain.value = ambientGain.gain.value / 0.4;
  };
}
```

El ratio de reducción se define en `appConfig.settings.ambientToVideoAudioRatio`.

---

### 8. MOTOR DE EFECTOS (EFFECTS ENGINE)

#### 8.1 Generación Eficiente en DOM

Prohibido el recalculo de estilos o inserción iterativa directa en el DOM principal. JavaScript opera como emisor de partículas efímeras instanciadas dentro de un `DocumentFragment`.

#### 8.2 Inyección y Enlace de Estilos

Cada partícula recibe parámetros dinámicos mediante variables CSS aleatorias (`--p-delay`, `--p-x`, `--p-scale`). El fragmento completo se inserta en una transacción atómica en el contenedor del DOM.

#### 8.3 Delegación de Física a GPU

Toda la lógica transicional (gravedad, turbulencia, rotación, opacidad, desplazamiento) se delega al compositor CSS mediante propiedades aceleradas por hardware: `transform: translate3d(), rotate(), scale()` y `opacity`.

#### 8.4 Recolección Automática

Cada partícula escucha `animationend` o `transitionend`. Al completar su ciclo de vida, ejecuta `element.remove()` para liberar memoria.

#### 8.5 Efecto Inválido

Si `effect.name` no corresponde a ningún módulo cargado en `/src/effects/`, el motor omite la inyección sin interrumpir el flujo del reproductor.

---

### 9. ESTRATEGIA DE CSS Y DESIGN SYSTEM

#### 9.1 Layout y Proporciones

- `html, body { overflow: hidden }` para anular scroll.
- `height: 100dvh` para neutralizar barras dinámicas de navegadores móviles.
- Capas en posición absoluta con `z-index` explícito: Fondo Multimedia < Partículas < Controles.

#### 9.2 Sistema Cromático (Design Tokens)

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

### 10. ESTRATEGIA DE PERFORMANCE

#### 10.1 Propiedades Seguras de Animación

Solo se permite animar `transform` y `opacity` dentro de `@keyframes`, evitando fases de Layout y Paint.

#### 10.2 Eventos Táctiles

Todos los touch listeners (`touchstart`, `touchmove`) se configuran con `{ passive: true }`.

#### 10.3 FPS Configurable

El target de FPS se define en `appConfig.settings.targetFps` (valor por defecto: 60). La evaluación de rendimiento se realiza contra este valor configurable. `requestAnimationFrame` se adapta al refresh rate del dispositivo.

---

### 11. LAZY LOADING Y ESTRATEGIA DE RED

- **Precarga N+1:** Durante el slide N, se precarga en memoria el recurso N+1.
- **Lazy loading nativo:** Recursos con índice > N+1 usan `loading="lazy"` en `<img>` y `preload="metadata"` en `<video>`.
- **Fallback de red:** Si la precarga de N+1 falla, el reproductor continúa con el slide actual sin precarga y reintenta en el siguiente ciclo.

---

### 12. MANEJO DE ERRORES

Mecanismo centralizado, modular y escalable para garantizar que ningún fallo externo interrumpa la experiencia.

#### 12.1 Imagen
- Evento `onerror` en `<img>`: insertar placeholder visual genérico, registrar error en consola, no interrumpir el flujo.

#### 12.2 Video
- Evento `onerror` o `onabort` en `<video>`: saltar al siguiente slide automáticamente.

#### 12.3 AudioContext
- Si `AudioContext` no puede instanciarse o reanudarse: operar en modo silencioso, continuar sin audio.

#### 12.4 Fullscreen
- Si `requestFullscreen()` lanza excepción: ocultar el `dialog` de todas formas y operar en modo ventana.
- Si el usuario sale de fullscreen manualmente: cerrar la pestaña (`window.close()`).

#### 12.5 appConfig Malformado
- Si `appConfig` no puede evaluarse o su estructura es inválida: renderizar pantalla de error estático con mensaje legible.

#### 12.6 Efecto Inválido
- Si `effect.name` no existe en el motor: omitir el efecto, continuar con el slide.

---

### 13. ACCESIBILIDAD

- `#app-container` implementa `aria-live="polite"` para notificar cambios de slide.
- Controles táctiles invisibles (`#touch-prev`, `#touch-next`) incluyen `aria-label`.
- El motor de efectos respeta `@media (prefers-reduced-motion: reduce)` reduciendo o anulando animaciones de partículas.

La aplicación está diseñada exclusivamente para interacción táctil en dispositivos móviles. No se implementa navegación por teclado.

---

### 14. ESTRATEGIA DE CACHÉ

- Sin Service Worker ni Cache API.
- Encabezados HTTP configurados en Netlify para `Cache-Control: no-cache` o `must-revalidate`.
- La única precarga permitida es la precarga en memoria N+1 desde JavaScript.

---

### 15. CRITERIOS DE ACEPTACIÓN TÉCNICA

1. **Cero dependencias:** Sin referencias a librerías externas JS o CSS.
2. **Rendimiento:** Renderizado estable al target definido en `appConfig.settings.targetFps` en dispositivos móviles de gama media.
3. **Persistencia de audio:** El sistema debe mitigar errores de lanzamiento asíncrono de sonido tras la pantalla de desbloqueo.
4. **Manejo de errores:** Ningún fallo individual (imagen rota, video corrupto, API bloqueada) debe interrumpir la ejecución del reproductor.

---

### 16. ROADMAP TÉCNICO

#### Hito 1: Arquitectura Base e Inyección Cromática
- Estructura física del proyecto.
- `index.html` con puntos de montaje.
- `styles.css` con variables oklch y design tokens.
- Bootstrap de JavaScript y carga de `appConfig`.
- **Criterio:** La app carga y muestra una pantalla estática con el splash dialog y la paleta cromática correcta.

#### Hito 2: Máquina de Estados y Loop Infinito
- `state.js` con máquina de estados (Init → Unlock → Render → Loop).
- Componente `<dialog>` de entrada con fullscreen.
- Renderizado secuencial de slides imagen/video.
- Loop infinito al final del array.
- Manejo de errores básico (imagen, video, fullscreen).
- **Criterio:** Navegación completa cíclica entre slides sin interrupción.

#### Hito 3: Motor de Efectos y Lazy Loading
- Módulo genérico de efectos basado en `DocumentFragment`.
- Efecto lluvia (rain) con física CSS.
- Efecto confeti (confetti) con física CSS.
- Precarga N+1 y lazy loading nativo.
- **Criterio:** Efectos visuales superpuestos sin degradación de FPS. Precarga funcional.

#### Hito 4: Audio Dual y Afinación de Performance
- Integración de Web Audio API con bucles ambientales.
- Reducción de volumen ambiental durante reproducción de video.
- Sistema de FPS configurable y monitoreo básico.
- Soporte para `prefers-reduced-motion`.
- **Criterio:** Audio ambiental sincronizado con efectos, reducción automática al 40% durante video con audio.

---

Este documento constituye el contrato técnico definitivo de arquitectura para **animame.ar**.
