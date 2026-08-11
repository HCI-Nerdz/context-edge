type Pan = {
  x: number;
  y: number;
  bound: boolean;
};

const pans = new WeakMap<HTMLElement, Pan>();

function canvasOf(viewport: HTMLElement) {
  return viewport.querySelector<HTMLElement>('.cr-tree-canvas');
}

function apply(viewport: HTMLElement, pan: Pan) {
  const canvas = canvasOf(viewport);
  if (canvas) canvas.style.transform = `translate(${pan.x}px, ${pan.y}px)`;
}

/** Click-drag / touch-drag the org tree. Bind once per viewport; safe to call again after remount. */
export function bindTreePan(viewport: HTMLElement) {
  let pan = pans.get(viewport);
  if (!pan) {
    pan = { x: 0, y: 0, bound: false };
    pans.set(viewport, pan);
  }
  apply(viewport, pan);
  if (pan.bound) return;
  pan.bound = true;

  let dragging = false;
  let moved = false;
  let pid = 0;
  let lastX = 0;
  let lastY = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    pid = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (!moved && dx * dx + dy * dy < 25) return;
    moved = true;
    lastX = e.clientX;
    lastY = e.clientY;
    pan.x += dx;
    pan.y += dy;
    viewport.classList.add('is-panning');
    apply(viewport, pan);
    e.preventDefault();
  });

  const end = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    dragging = false;
    viewport.classList.remove('is-panning');
    if (moved) viewport.dataset.panSuppress = '1';
  };

  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  viewport.addEventListener(
    'click',
    (e) => {
      if (!viewport.dataset.panSuppress) return;
      delete viewport.dataset.panSuppress;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
}

export function panTreeCurrentIntoView(viewport: HTMLElement) {
  const pan = pans.get(viewport);
  const card = viewport.querySelector<HTMLElement>('.cr-tree-card.is-current');
  if (!pan || !card) return;
  const vr = viewport.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  pan.x += vr.left + vr.width * 0.5 - (cr.left + cr.width * 0.5);
  pan.y += vr.top + vr.height * 0.4 - (cr.top + cr.height * 0.5);
  apply(viewport, pan);
}
