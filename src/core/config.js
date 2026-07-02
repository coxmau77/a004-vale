export const appConfig = {
  settings: {
    slideDuration: 5000,
    targetFps: 60,
    enableSwipe: true,
    baseColor: "oklch(55% 0.22 260)",
    ambientAudioEnabled: true,
    ambientToVideoAudioRatio: 0.4,
  },
  content: [
    {
      id: 1,
      type: "image",
      src: "./assets/img/slide1.svg",
      alt: "Escena de introducción histórica",
      effect: {
        name: "rain",
        intensity: 80,
        audioSrc: "./assets/audio/rain-loop.wav",
      },
    },
    {
      id: 2,
      type: "image",
      src: "./assets/img/slide2.svg",
      alt: "Segunda escena ilustrativa",
    },
    {
      id: 3,
      type: "image",
      src: "./assets/img/slide3.svg",
      alt: "Tercera escena ilustrativa",
    },
    {
      id: 4,
      type: "video",
      src: "./assets/video/placeholder.mp4",
      poster: "./assets/img/poster2.svg",
      autoplay: false,
      hasAudioTrack: true,
      effect: {
        name: "confetti",
        intensity: 120,
      },
    },
  ],
};
