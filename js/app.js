import { PlayerState } from "../src/core/state.js";

document.addEventListener("DOMContentLoaded", () => {
  const state = new PlayerState();
  state.init();
  state.render(0);
});
