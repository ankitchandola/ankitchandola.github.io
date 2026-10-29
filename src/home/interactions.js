const $ = (id) => document.getElementById(id);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = $('motion');
let paused = false;
try {
  paused = localStorage.getItem('ankit-motion-paused') === 'true';
} catch {
  // Motion controls remain available when storage is blocked.
}
function applyMotion() {
  const stopped = paused || reduced.matches;
  document.body.classList.toggle('motion-paused', stopped);
  motionButton.setAttribute('aria-pressed', String(stopped));
  $('motion-label').textContent = reduced.matches
    ? 'Motion reduced'
    : paused
      ? 'Play motion'
      : 'Pause motion';
  motionButton.disabled = reduced.matches;
}
motionButton.addEventListener('click', () => {
  paused = !paused;
  try {
    localStorage.setItem('ankit-motion-paused', String(paused));
  } catch {
    // Motion controls still work when browser storage is unavailable.
  }
  applyMotion();
});
reduced.addEventListener('change', applyMotion);
applyMotion();
