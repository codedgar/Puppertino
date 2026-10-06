/* The Puppertino Glass demo on the Materials page: drag the pill across
   the photo, or move it with the arrow keys. Glassworks reads the pill's
   position every frame, so the refraction follows it live. */

function offset(pill) {
  const [x = 0, y = 0] = (pill.style.translate || '0px 0px').split(' ').map(parseFloat);
  return { x, y };
}

function clamp(pill, x, y) {
  const stage = pill.closest('.glass-demo').getBoundingClientRect();
  const own = pill.getBoundingClientRect();
  const at = offset(pill);
  return {
    x: Math.min(at.x + stage.right - own.right, Math.max(at.x + stage.left - own.left, x)),
    y: Math.min(at.y + stage.bottom - own.bottom, Math.max(at.y + stage.top - own.top, y)),
  };
}

function place(pill, x, y) {
  const p = clamp(pill, x, y);
  pill.style.translate = `${p.x}px ${p.y}px`;
}

document.addEventListener('pointerdown', (event) => {
  const pill = event.target.closest('.glass-demo-drag');
  if (!pill || event.button !== 0) return;
  const origin = offset(pill);
  const start = { x: event.clientX, y: event.clientY };
  pill.setPointerCapture(event.pointerId);
  const move = (e) => place(pill, origin.x + e.clientX - start.x, origin.y + e.clientY - start.y);
  const stop = () => {
    pill.removeEventListener('pointermove', move);
    pill.removeEventListener('pointerup', stop);
    pill.removeEventListener('pointercancel', stop);
  };
  pill.addEventListener('pointermove', move);
  pill.addEventListener('pointerup', stop);
  pill.addEventListener('pointercancel', stop);
});

const STEPS = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };

document.addEventListener('keydown', (event) => {
  const pill = event.target.closest && event.target.closest('.glass-demo-drag');
  const step = pill && STEPS[event.key];
  if (!step) return;
  event.preventDefault();
  const at = offset(pill);
  place(pill, at.x + step[0], at.y + step[1]);
});
