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
  'normal',
  'color',
  'soft-light',
  'overlay',
  'multiply',
  'screen',
  'hue',
  'saturation',
  'luminosity',
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

/** Heroicons v2 outline home — MIT. Inline so currentColor follows tile ink. */
export const HOME_ICON_SVG = `<svg class="pe-home-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.25 12L11.2045 3.04549C11.6438 2.60615 12.3562 2.60615 12.7955 3.04549L21.75 12M4.5 9.75V19.875C4.5 20.4963 5.00368 21 5.625 21H9.75V16.125C9.75 15.5037 10.2537 15 10.875 15H13.125C13.7463 15 14.25 15.5037 14.25 16.125V21H18.375C18.9963 21 19.5 20.4963 19.5 19.875V9.75M8.25 21H16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Relative luminance (WCAG). Returns 0–1 for sRGB hex (#rgb / #rrggbb).
 * Used to pick light vs dark tile ink independent of page theme.
 */
export function relativeLuminance(hex: string): number | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Light ink on dark tiles, dark ink on light tiles — from the tile fill, not page theme. */
export function inkForBg(
  hex: string,
  opts?: { light?: string; dark?: string; threshold?: number },
): string {
  const light = opts?.light ?? '#f4f7f6';
  const dark = opts?.dark ?? '#12181a';
  const threshold = opts?.threshold ?? 0.45;
  const L = relativeLuminance(hex);
  if (L == null) return light;
  return L > threshold ? dark : light;
}

/**
 * Approximate the Subtle mono fill for ink contrast (mirrors CSS color-mix weights).
 */
export function approxMonoHex(color: string, mixPct: number, grayL: number): string {
  const raw = color.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return color;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const t = Math.min(1, Math.max(0, mixPct / 100));
  const gray = Math.round((grayL / 100) * 255);
  const mix = (c: number) => Math.round(c * t + gray * (1 - t));
  const r = mix(parseInt(full.slice(0, 2), 16));
  const g = mix(parseInt(full.slice(2, 4), 16));
  const b = mix(parseInt(full.slice(4, 6), 16));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

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

/** Ink for a hop given Color vs Subtle style (tile fill, not page theme). */
export function pathSegInk(
  nodeColor: string,
  opts: { style: 'color' | 'subtle'; fromRoot: number; count: number; page: PathNode },
): string {
  if (opts.style === 'color') return inkForBg(nodeColor);
  const shade = depthShade(opts.fromRoot, opts.count);
  const grayL = 18 + shade * 42;
  const approx = approxMonoHex(opts.page.color, 14, grayL);
  return inkForBg(approx);
}

export type PathEdgeAxis = 'top' | 'left';

/** Shared Path Edge page lede — vanilla and framework implementations. */
export const PATH_EDGE_LEDE =
  'One edge at a time — Top (marks + quiet labels) or Side (icons + labels). Resting and Live each get a full stage; Color / Subtle is a style switch. Shrink the demo zone to overflow; drag or swipe the rail to scroll hops out from under Home.';

export const PATH_EDGE_DESCRIPTION =
  'Path Edge workshop: Top or Side; Resting and Live rows; Color / Subtle style; overflow scroll with pinned Home.';

/**
 * FUTURE: pull-down / swipe-down on the page to reveal then dismiss the top Path bar.
 * Browsers currently capture vertical overscroll for pull-to-refresh, so this stays off.
 * Flip when UA behavior allows a reliable page-owned gesture.
 */
export const PE_TOP_PULL_REVEAL = false;

/**
 * Mobile: swipe from the left stage edge to toggle the Path bar open/closed.
 * Prefer this over top pull-to-reveal while browsers own vertical overscroll.
 */
export function bindMobileEdgeSwipe(
  stage: HTMLElement,
  opts: {
    onToggle: (open: boolean) => void;
    isOpen: () => boolean;
    edgePx?: number;
  },
): () => void {
  const edgePx = opts.edgePx ?? 28;
  let tracking = false;
  let startX = 0;
  let startY = 0;
  let pointerId = -1;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = stage.getBoundingClientRect();
    if (e.clientX - rect.left > edgePx) return;
    tracking = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onUp = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    pointerId = -1;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    if (dx > 0 && !opts.isOpen()) opts.onToggle(true);
    else if (dx < 0 && opts.isOpen()) opts.onToggle(false);
  };

  const onCancel = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    tracking = false;
    pointerId = -1;
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onCancel);

  return () => {
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onCancel);
  };
}

/**
 * Stub for future top pull-to-reveal (see PE_TOP_PULL_REVEAL).
 * No-op while browsers capture the gesture for refresh.
 */
export function bindTopPullReveal(
  _stage: HTMLElement,
  _opts: { onReveal: () => void; onDismiss: () => void },
): () => void {
  if (!PE_TOP_PULL_REVEAL) return () => {};
  return () => {};
}

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
