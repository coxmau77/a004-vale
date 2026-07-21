import { appConfig } from "./config.js";
import { updateProgress } from "../ui/progress.js";
import { startEffect, stopEffect, handlePointer } from "../effects/index.js";

export class PlayerState {
  constructor() {
    this.config = appConfig;
    this.currentIndex = 0;
    this.timer = null;
    this.transitionTimer = null;
    this.mediaContainer = document.getElementById("media-container");
    this.effectsContainer = document.getElementById("effects-canvas");
    this.loader = document.getElementById("loader");
    this.currentElement = null;
    this.onScreenElement = null;
    this.heartsBtn = document.getElementById("hearts-btn");
    this.heartsProgress = document.getElementById("hearts-progress");
    this.heartsActive = false;
    this.heartsAnimating = false;
  }

  init() {
    this.buildProgressBar();
    startEffect(this.effectsContainer, this.config.effect);

    const app = document.getElementById("app-container");
    app.addEventListener("click", (e) => {
      if (e.target.closest("#progress-container")) return;
      if (e.target.closest("#hearts-interaction")) return;
      handlePointer(e, this.effectsContainer);
    });

    this.heartsBtn.addEventListener("click", () => this.toggleHearts());
  }

  buildProgressBar() {
    const container = document.getElementById("progress-container");
    container.innerHTML = "";
    this.config.content.forEach((_, i) => {
      const seg = document.createElement("div");
      seg.className = "progress-segment";
      if (i === 0) seg.classList.add("active");
      seg.addEventListener("click", () => this.render(i));
      container.appendChild(seg);
    });
  }

  render(index) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    const oldElement = this.currentElement;

    for (const el of this.mediaContainer.children) {
      if (el !== oldElement && el !== this.onScreenElement) {
        el.remove();
      }
    }

    this.currentIndex = index;
    const slide = this.config.content[this.currentIndex];
    const newElement = this.createImage(slide);

    newElement.style.opacity = "0";
    this.mediaContainer.appendChild(newElement);
    this.currentElement = newElement;

    const startTransition = () => {
      if (this.currentElement !== newElement) return;

      this.loader?.classList.add("hidden");

      const toRemove = this.onScreenElement;

      if (toRemove) {
        toRemove.style.opacity = "0";
      }

      getComputedStyle(newElement).opacity;
      newElement.style.opacity = "1";

      this.onScreenElement = newElement;

      for (const el of this.mediaContainer.children) {
        if (el !== newElement && el !== toRemove) {
          el.remove();
        }
      }

      this.transitionTimer = setTimeout(() => {
        if (toRemove && toRemove.parentNode) {
          toRemove.remove();
        }
        this.transitionTimer = null;
      }, 1500); // ← (ms) Duración del crossfade entre slides — debe coincidir con transition: opacity en CSS

      updateProgress(this.currentIndex);
      this.preloadNext();

      this.timer = setTimeout(
        () => this.next(),
        this.config.settings.slideDuration,
      );
    };

    if (newElement.complete) {
      startTransition();
    } else {
      newElement.addEventListener("load", startTransition, { once: true });
      newElement.addEventListener(
        "error",
        () => {
          console.warn(`Error cargando imagen: ${slide.src}`);
          startTransition();
        },
        { once: true },
      );
    }
  }

  createImage(slide) {
    const img = document.createElement("img");
    img.src = slide.src;
    img.alt = slide.alt;
    img.draggable = false;

    img.onerror = () => {
      console.warn(`Error cargando imagen: ${slide.src}`);
      img.style.display = "none";
      const fallback = document.createElement("div");
      fallback.textContent = "Imagen no disponible";
      fallback.style.cssText =
        "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:1rem;background:var(--bg-dark)";
      this.mediaContainer.appendChild(fallback);
    };

    return img;
  }

  next() {
    const nextIndex = (this.currentIndex + 1) % this.config.content.length;
    this.render(nextIndex);
  }

  preloadNext() {
    for (let i = 1; i <= 2; i++) {
      // ← Cantidad de slides siguientes a precargar en segundo plano
      const idx = (this.currentIndex + i) % this.config.content.length;
      const slide = this.config.content[idx];
      const img = new Image();
      img.src = slide.src;
    }
  }

  toggleHearts() {
    if (this.heartsAnimating) return;

    if (this.heartsActive) {
      stopEffect();
      this.heartsActive = false;
      this.heartsBtn.classList.remove("active");
      this.heartsProgress.value = 0;
      return;
    }

    this.heartsAnimating = true;
    this.heartsProgress.value = 0;

    const duration = 2000;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      this.heartsProgress.value = progress * 100;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        this.heartsAnimating = false;
        this.heartsActive = true;
        this.heartsBtn.classList.add("active");
        startEffect(this.effectsContainer, { name: "hearts", intensity: 50 });
      }
    };

    requestAnimationFrame(tick);
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    if (this.currentElement) {
      this.currentElement.onerror = null;
      this.currentElement = null;
    }
    stopEffect();
  }
}
