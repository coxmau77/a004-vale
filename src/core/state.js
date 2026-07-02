import { appConfig } from "./config.js";
import { updateProgress } from "../ui/progress.js";
import { initControls } from "../ui/controls.js";

export class PlayerState {
  constructor() {
    this.config = appConfig;
    this.currentIndex = 0;
    this.timer = null;
    this.transitionTimer = null;
    this.mediaContainer = document.getElementById("media-container");
    this.currentElement = null;
  }

  init() {
    this.buildProgressBar();
    initControls(() => this.prev(), () => this.next());
  }

  buildProgressBar() {
    const container = document.getElementById("progress-container");
    container.innerHTML = "";
    this.config.content.forEach((_, i) => {
      const seg = document.createElement("div");
      seg.className = "progress-segment";
      if (i === 0) seg.classList.add("active");
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
      if (el !== oldElement) {
        el.remove();
      }
    }

    if (oldElement) {
      oldElement.onerror = null;
      oldElement.onabort = null;
      oldElement.onended = null;
      oldElement.style.opacity = "0";
    }

    this.currentIndex = index;
    const slide = this.config.content[this.currentIndex];

    let newElement;
    if (slide.type === "image") {
      newElement = this.createImage(slide);
    } else {
      newElement = this.createVideo(slide);
    }

    newElement.style.opacity = "0";
    this.mediaContainer.appendChild(newElement);
    this.currentElement = newElement;

    getComputedStyle(newElement).opacity;
    newElement.style.opacity = "1";

    this.transitionTimer = setTimeout(() => {
      if (oldElement && oldElement.parentNode) {
        oldElement.remove();
      }
      this.transitionTimer = null;
    }, 500);

    updateProgress(this.currentIndex);
    this.preloadNext();

    if (slide.type === "image") {
      this.timer = setTimeout(
        () => this.next(),
        this.config.settings.slideDuration
      );
    } else {
      newElement.play().catch(() => this.next());
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

  createVideo(slide) {
    const video = document.createElement("video");
    video.src = slide.src;
    video.poster = slide.poster || "";
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = !slide.hasAudioTrack;
    video.setAttribute("playsinline", "");

    video.onerror = () => {
      console.warn(`Error cargando video: ${slide.src}, saltando...`);
      this.next();
    };

    video.onabort = () => this.next();
    video.onended = () => this.next();

    return video;
  }

  next() {
    const nextIndex = (this.currentIndex + 1) % this.config.content.length;
    this.render(nextIndex);
  }

  prev() {
    const prevIndex =
      (this.currentIndex - 1 + this.config.content.length) %
      this.config.content.length;
    this.render(prevIndex);
  }

  preloadNext() {
    const nextIndex = (this.currentIndex + 1) % this.config.content.length;
    const nextSlide = this.config.content[nextIndex];
    if (nextSlide.type === "image") {
      const img = new Image();
      img.src = nextSlide.src;
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
      this.currentElement.onabort = null;
      this.currentElement.onended = null;
      this.currentElement = null;
    }
  }
}
