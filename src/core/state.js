import { appConfig } from "./config.js";
import { updateProgress } from "../ui/progress.js";
import { startEffect, stopEffect, stopEffectSmooth, handlePointer } from "../effects/index.js";
import { triggerBurst } from "../effects/hearts.js";

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
    this.heartsValue = 0;
    this.heartsFilling = false;
    this.heartsEffectOn = false;
    this.heartsRafId = null;
    this.heartsLastTs = null;
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

    this.heartsBtn.addEventListener("pointerdown", (e) => this._heartsPointerDown(e));
    this.heartsBtn.addEventListener("pointerup", () => this._heartsPointerUp());
    this.heartsBtn.addEventListener("pointerleave", () => this._heartsPointerUp());
    this.heartsBtn.addEventListener("pointercancel", () => this._heartsPointerUp());
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

  _heartsPointerDown(e) {
    e.preventDefault();
    if (this.heartsEffectOn || this.heartsFilling) return;

    const btnRect = this.heartsBtn.getBoundingClientRect();
    const canvasRect = this.effectsContainer.getBoundingClientRect();
    const x = btnRect.left + btnRect.width / 2 - canvasRect.left;
    const y = btnRect.top + btnRect.height / 2 - canvasRect.top;
    triggerBurst(this.effectsContainer, x, y);

    this.heartsValue = Math.min(this.heartsValue + 10, 100);
    this.heartsProgress.value = this.heartsValue;

    if (this.heartsValue >= 100) {
      this.heartsValue = 100;
      this.heartsEffectOn = true;
      startEffect(this.effectsContainer, { name: "hearts", intensity: 50 });
      return;
    }

    this.heartsFilling = true;
    this.heartsBtn.classList.add("active");
    if (!this.heartsRafId) {
      this.heartsLastTs = performance.now();
      this.heartsRafId = requestAnimationFrame((ts) => this._heartsTick(ts));
    }
  }

  _heartsPointerUp() {
    this.heartsFilling = false;
  }

  _heartsTick(ts) {
    const dt = (ts - this.heartsLastTs) / 1000;
    this.heartsLastTs = ts;

    if (this.heartsFilling) {
      this.heartsValue += 55 * dt;
      if (this.heartsValue >= 100) {
        this.heartsValue = 100;
        this.heartsEffectOn = true;
        this.heartsFilling = false;
        startEffect(this.effectsContainer, { name: "hearts", intensity: 50 });
      }
    } else if (this.heartsValue > 0) {
      const drain = this.heartsEffectOn ? 3.33 : 40;
      this.heartsValue -= drain * dt;
      if (this.heartsValue <= 0) {
        this.heartsValue = 0;
        this.heartsRafId = null;
        this.heartsProgress.value = 0;
        if (this.heartsEffectOn) {
          this.heartsEffectOn = false;
          this.heartsBtn.classList.remove("active");
          stopEffectSmooth(this.effectsContainer);
        }
        return;
      }
    } else {
      this.heartsRafId = null;
      return;
    }

    this.heartsProgress.value = this.heartsValue;
    this.heartsRafId = requestAnimationFrame((t) => this._heartsTick(t));
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
    if (this.heartsRafId) {
      cancelAnimationFrame(this.heartsRafId);
      this.heartsRafId = null;
    }
    if (this.currentElement) {
      this.currentElement.onerror = null;
      this.currentElement = null;
    }
    stopEffect();
  }
}
