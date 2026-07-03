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
  }

  init() {
    this.buildProgressBar();
    startEffect(this.effectsContainer, this.config.effect);

    const app = document.getElementById("app-container");
    app.addEventListener("click", (e) => {
      if (e.target.closest("#progress-container")) return;
      handlePointer(e, this.effectsContainer);
    });
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
      }, 500);

      updateProgress(this.currentIndex);
      this.preloadNext();

      this.timer = setTimeout(
        () => this.next(),
        this.config.settings.slideDuration
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
        { once: true }
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
      const idx = (this.currentIndex + i) % this.config.content.length;
      const slide = this.config.content[idx];
      const img = new Image();
      img.src = slide.src;
    }
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
