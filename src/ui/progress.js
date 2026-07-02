export function updateProgress(index) {
  const segments = document.querySelectorAll(
    "#progress-container .progress-segment"
  );
  segments.forEach((seg, i) => {
    seg.classList.toggle("active", i === index);
  });
}
