export function initControls(onPrev, onNext) {
  const prevBtn = document.getElementById("touch-prev");
  const nextBtn = document.getElementById("touch-next");

  const handlePrev = (e) => {
    e.preventDefault();
    onPrev();
  };

  const handleNext = (e) => {
    e.preventDefault();
    onNext();
  };

  prevBtn.addEventListener("click", handlePrev);
  prevBtn.addEventListener("touchstart", handlePrev, { passive: true });
  nextBtn.addEventListener("click", handleNext);
  nextBtn.addEventListener("touchstart", handleNext, { passive: true });
}
