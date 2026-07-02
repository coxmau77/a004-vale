# PLAN DE IMPLEMENTACIÓN — ANIMAME.AR

## Estrategia de Commits

Convención: `tipo: descripción en español`

| Tipo | Uso |
|------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de errores |
| `chore:` | Tareas de mantenimiento / estructura |
| `upload:` | Adición de assets multimedia |

Rama única: `main`

---

## Hito 1 (Redefinido): Arquitectura Base — Reproductor Inmediato

| # | Commit | Archivos involucrados |
|---|--------|----------------------|
| 1 | `chore: estructura inicial del proyecto` | `.gitignore`, carpetas del proyecto |
| 2 | `feat: index.html con puntos de montaje` | `index.html` |
| 3 | `feat: design tokens y layout responsive max-width 720px` | `css/styles.css` |
| 4 | `feat: appConfig con estructura de datos` | `src/core/config.js` |
| 5 | `upload: assets Istory` | `assets/img/` |
| 6 | `feat: bootstrap del reproductor` | `js/app.js` |
| 7 | `feat: transición crossfade entre slides` | `css/styles.css`, `src/core/state.js` |

## Hito 2: Máquina de Estados y Loop Infinito

| # | Commit | Archivos involucrados |
|---|--------|----------------------|
| 8 | `feat: máquina de estados del reproductor` | `src/core/state.js` |
| 9 | `feat: renderizado de slides imagen y video` | `js/app.js`, `state.js` |
| 10 | `feat: barra de progreso fraccionada` | `src/ui/progress.js`, `css/styles.css` |
| 11 | `feat: controles táctiles de navegación` | `src/ui/controls.js` |
| 12 | `feat: loop infinito al final del array` | `state.js` |
| 13 | `feat: manejo centralizado de errores` | `state.js`, `css/styles.css` |

## ~~Hito 3: Motor de Efectos y Precarga~~ ✅

| # | Commit | Archivos involucrados |
|---|--------|----------------------|
| 14 | ~~`feat: motor de efectos genérico`~~ | ~~`src/effects/index.js`~~ |
| 15 | ~~`feat: efecto de lluvia`~~ | ~~`src/effects/rain.js`~~ |
| 16 | ~~`feat: efecto de confeti`~~ | ~~`src/effects/confetti.js`~~ |
| 17 | ~~`feat: precarga N+1 y lazy loading`~~ | ~~`state.js`~~ |

## Hito 4: Audio, Performance y reduced-motion

| # | Commit | Archivos involucrados |
|---|--------|----------------------|
| 18 | `feat: AudioContext global y bucles ambientales` | `src/core/audio.js` |
| 19 | `feat: audio dual con reducción de volumen` | `src/core/audio.js` |
| 20 | `feat: FPS configurable y monitoreo` | `js/app.js` |
| 21 | `feat: respeto por prefers-reduced-motion` | `css/styles.css`, efectos |

---

## Criterios de Aceptación por Hito

### Hito 1
- La app carga y muestra el primer slide inmediatamente.
- Layout responsive centrado con `max-width: 720px`.
- Navegación táctil (prev/next) funcional.
- Transición suave (crossfade) entre slides sin parpadeos.
- Loop infinito entre slides.

### Hito 2
- Navegación completa cíclica entre slides sin interrupción.
- Errores de red/medio no rompen el flujo.

### Hito 3 ✅
- Efectos visuales superpuestos sin degradación de FPS.
- Precarga N+1 funcional.
- Efecto inválido se omite sin error.

### Hito 4
- Audio ambiental sincronizado con efectos.
- Reducción automática al 40% durante video con audio.
- Respeto por `prefers-reduced-motion`.

---

*Plan actualizado el 2026-07-02. Basado en `docs/spec.md`.*
