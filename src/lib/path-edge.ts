export type PathNode = {
  id: string;
  label: string;
  role: string;
  blurb: string;
  color: string;
  mark: string;
};

export const demoPath: PathNode[] = [
  {
    id: 'home',
    label: 'Home',
    role: 'Root',
    blurb: 'Entrypoint of the ecosystem — the first color in the path.',
    color: '#4285f4',
    mark: '⌂',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    role: 'Platform',
    blurb: 'A subplatform under Home. Its color is unique on this path.',
    color: '#ea4335',
    mark: '☁',
  },
  {
    id: 'console',
    label: 'Console',
    role: 'Control plane',
    blurb: 'The console is another node, not another header language.',
    color: '#fbbc04',
    mark: '▣',
  },
  {
    id: 'billing',
    label: 'Billing',
    role: 'Domain',
    blurb: 'Billing is a level you enter — not a tab painted on Cloud.',
    color: '#34a853',
    mark: '◈',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    role: 'Collection',
    blurb: 'Another hop so a tight zone overflows — drag or swipe the rail to reveal ancestors under Home.',
    color: '#00acc1',
    mark: '▤',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    role: 'Current',
    blurb: 'You are here. One mark identifies the level; the job is to click into it, not decode an icon toolbar.',
    color: '#a142f4',
    mark: '◉',
  },
];

export function pathThrough(id: string, all: PathNode[] = demoPath): PathNode[] {
  const i = all.findIndex((n) => n.id === id);
  if (i < 0) return all.slice(0, 1);
  return all.slice(0, i + 1);
}

/** Depth shade for monochrome idle rails (0 = root). */
export function depthShade(indexFromRoot: number, count: number): number {
  if (count <= 1) return 0.55;
  return 0.28 + (0.5 * indexFromRoot) / (count - 1);
}

export const BLEND_MODES = [
  'color',
  'soft-light',
  'overlay',
  'multiply',
  'screen',
  'hue',
  'saturation',
  'luminosity',
  'normal',
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export function pathStageVars(current: PathNode) {
  return {
    page: current.color,
    /* Lightness/mix % come from --pe-mono-* on .pe-stage (theme tokens). */
    monoTop: `color-mix(in srgb, ${current.color} var(--pe-mono-mix-top), hsl(0 0% var(--pe-mono-l-top)))`,
    monoLeft: `color-mix(in srgb, ${current.color} var(--pe-mono-mix-left), hsl(0 0% var(--pe-mono-l-left)))`,
  };
}

export function pathSegMono(current: PathNode, fromRoot: number, count: number) {
  const shade = depthShade(fromRoot, count);
  return `color-mix(in srgb, ${current.color} var(--pe-mono-mix-seg), hsl(0 0% calc(var(--pe-mono-l-min) + ${shade} * var(--pe-mono-l-span))))`;
}

export type PathEdgeAxis = 'top' | 'left';

/** Shared Path Edge page lede — vanilla and framework implementations. */
export const PATH_EDGE_LEDE =
  'One edge at a time — Top (marks + quiet labels) or Side (marks). Rest and Live each get a full stage; Color / Subtle is a style switch. Shrink the demo zone to overflow; drag or swipe the rail to scroll hops out from under Home.';

export const PATH_EDGE_DESCRIPTION =
  'Path Edge workshop: Top or Side; Rest and Live rows; Color / Subtle style; overflow scroll with pinned Home.';

export function namePathHops(stage: HTMLElement, sid: string) {
  stage.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
    const axis = el.classList.contains('pe-seg-top') ? 'top' : 'left';
    el.style.viewTransitionName = `pe-${sid}-${axis}-${el.dataset.goto}`;
  });
}

export function markPathLeaves(stage: HTMLElement, nextId: string, all: PathNode[] = demoPath) {
  const keep = new Set(pathThrough(nextId, all).map((n) => n.id));
  stage.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
    const id = el.dataset.goto ?? '';
    const axis = el.classList.contains('pe-seg-top') ? 'top' : 'left';
    el.style.viewTransitionClass = keep.has(id) ? 'pe-keep' : `pe-leaf pe-leaf-${axis}`;
  });
}

/**
 * Pointer drag → scrollLeft/scrollTop on a hidden-scrollbar overflow scroller.
 * Distinguishes drag from click via a small move threshold.
 */
export function bindPathDragScroll(scroller: HTMLElement, axis: PathEdgeAxis): () => void {
  const horizontal = axis === 'top';
  let active = false;
  let dragging = false;
  let pointerId = -1;
  let startClient = 0;
  let startScroll = 0;
  const THRESHOLD = 4;

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    active = true;
    dragging = false;
    pointerId = e.pointerId;
    startClient = horizontal ? e.clientX : e.clientY;
    startScroll = horizontal ? scroller.scrollLeft : scroller.scrollTop;
    scroller.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return;
    const client = horizontal ? e.clientX : e.clientY;
    const delta = client - startClient;
    if (!dragging && Math.abs(delta) >= THRESHOLD) {
      dragging = true;
      scroller.classList.add('is-dragging');
    }
    if (!dragging) return;
    e.preventDefault();
    if (horizontal) scroller.scrollLeft = startScroll - delta;
    else scroller.scrollTop = startScroll - delta;
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (dragging) {
      scroller.dataset.peSuppressClick = '1';
      requestAnimationFrame(() => {
        delete scroller.dataset.peSuppressClick;
      });
    }
    active = false;
    dragging = false;
    pointerId = -1;
    scroller.classList.remove('is-dragging');
    try {
      scroller.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  scroller.addEventListener('pointerdown', onDown);
  scroller.addEventListener('pointermove', onMove);
  scroller.addEventListener('pointerup', onUp);
  scroller.addEventListener('pointercancel', onUp);

  return () => {
    scroller.removeEventListener('pointerdown', onDown);
    scroller.removeEventListener('pointermove', onMove);
    scroller.removeEventListener('pointerup', onUp);
    scroller.removeEventListener('pointercancel', onUp);
  };
}

/** Size the depth shadow to the current hop’s far edge, capped at the bar length. */
export function syncPathDepthShadow(rail: HTMLElement, axis: PathEdgeAxis) {
  const track = rail.querySelector('.pe-track') as HTMLElement | null;
  const shadow = rail.querySelector('.pe-depth-shadow') as HTMLElement | null;
  const here = rail.querySelector('.pe-seg.is-here') as HTMLElement | null;
  if (!track || !shadow) return;

  const barLen = axis === 'top' ? rail.clientWidth : rail.clientHeight;
  if (!here) {
    shadow.style.width = axis === 'top' ? '0px' : '100%';
    shadow.style.height = axis === 'top' ? '100%' : '0px';
    return;
  }

  /* Far edge of current in track coords; shadow right-aligns to that edge. */
  const far =
    axis === 'top'
      ? here.offsetLeft + here.offsetWidth
      : here.offsetTop + here.offsetHeight;
  const span = Math.min(Math.max(far, 0), barLen);
  const start = Math.max(0, far - span);

  if (axis === 'top') {
    shadow.style.width = `${span}px`;
    shadow.style.height = '100%';
    shadow.style.left = `${start}px`;
    shadow.style.top = '0';
  } else {
    shadow.style.height = `${span}px`;
    shadow.style.width = '100%';
    shadow.style.top = `${start}px`;
    shadow.style.left = '0';
  }
}

/** Prefer showing the current hop; ancestors may sit under the pinned Home. */
export function scrollPathToCurrent(scroller: HTMLElement, axis: PathEdgeAxis) {
  const here = scroller.querySelector('.pe-seg.is-here') as HTMLElement | null;
  if (!here) return;
  if (axis === 'top') {
    const max = scroller.scrollWidth - scroller.clientWidth;
    if (max <= 0) {
      scroller.scrollLeft = 0;
      return;
    }
    /* Align current’s right edge with the scroller’s right edge when possible. */
    const target = here.offsetLeft + here.offsetWidth - scroller.clientWidth;
    scroller.scrollLeft = Math.max(0, Math.min(max, target));
  } else {
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 0) {
      scroller.scrollTop = 0;
      return;
    }
    const target = here.offsetTop + here.offsetHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(max, target));
  }
}
