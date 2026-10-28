const $ = (id) => document.getElementById(id);
const phrases = [
  '<ankit chandola>',
  '</>',
  '<full stack developer>',
  '<problem solver>',
  '<tool builder>',
];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const morph = $('morph'),
  motionButton = $('motion');
let paused = false,
  index = 0,
  timeout = null,
  frame = null;
try {
  paused = localStorage.getItem('ankit-motion-paused') === 'true';
} catch {
  // Motion controls remain available when storage is blocked.
}
function stopLoop() {
  clearTimeout(timeout);
  cancelAnimationFrame(frame);
}
function canAnimate() {
  return !paused && !reduced.matches && !document.hidden;
}
function loop() {
  stopLoop();
  if (!canAnimate()) return;
  timeout = setTimeout(() => {
    const from = morph.textContent,
      next = phrases[++index % phrases.length],
      start = performance.now();
    const symbols = '<>/_{}';
    function tick(now) {
      if (!canAnimate()) return;
      const progress = Math.min(1, (now - start) / 620);
      const length = Math.round(
        from.length + (next.length - from.length) * progress,
      );
      const revealed = Math.floor(next.length * progress);
      morph.textContent =
        progress === 1
          ? next
          : Array.from({ length }, (_, i) =>
              i < revealed
                ? next[i] || ''
                : symbols[(i + Math.floor(progress * 18)) % symbols.length],
            ).join('');
      if (progress < 1) frame = requestAnimationFrame(tick);
      else loop();
    }
    frame = requestAnimationFrame(tick);
  }, 2600);
}
function applyMotion() {
  stopLoop();
  const stopped = paused || reduced.matches;
  document.body.classList.toggle('motion-paused', stopped);
  motionButton.setAttribute('aria-pressed', String(stopped));
  $('motion-label').textContent = reduced.matches
    ? 'Motion reduced'
    : paused
      ? 'Play motion'
      : 'Pause motion';
  motionButton.disabled = reduced.matches;
  morph.textContent = phrases[0];
  index = 0;
  loop();
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
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else applyMotion();
});
applyMotion();
