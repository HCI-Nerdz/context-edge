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
    color: '#c9a227',
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
    blurb: 'Another hop so a tight stage overflows — drag or swipe the rail to reveal ancestors under Home.',
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

/** Filled home glyph (Uiverse emmanuelh-dev path) — currentColor follows tile ink. */
export const HOME_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="pe-home-svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>`;

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

/** Shared Path Edge page lede — DemoHead variant description (not the workshop island). */
export const PATH_EDGE_LEDE =
  'As you move across products, the places you visited stay on one thin rail — Top or Side — with a rail foundation behind every hop. Each stop keeps its own color; Home stays pinned at the start. When the trail grows, drag, swipe, or arrow-key the rail to scroll older hops out from under Home. On touch, swipe inward from the left stage edge to open or dismiss the bar. Demo controls set Edge, Style, and blend math; Live and Still below are the product facsimile — drag a stage’s free edge to resize (both stay synced).';

export const PATH_EDGE_DESCRIPTION =
  'Path Edge keeps your cross-product trail on one edge rail — colored hops, pinned Home, Top or Side.';

/**
 * FUTURE: pull-down / swipe-down on the page to reveal then dismiss the top Path bar.
 * Browsers currently capture vertical overscroll for pull-to-refresh, so this stays off.
 * Flip when UA behavior allows a reliable page-owned gesture.
 */
export const PE_TOP_PULL_REVEAL = false;

/**
 * Keep this much rail foundation visible past the current/last hop when
 * aligning to the scroller’s trailing edge (and as overflow first engages).
 */
export const PE_TRAIL_END_INSET_PX = 100;

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

  let captured = false;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = stage.getBoundingClientRect();
    if (e.clientX - rect.left > edgePx) return;
    /* Don't capture yet — early capture stole hop/Home clicks. */
    tracking = true;
    captured = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
  };

  const onMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId || captured) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    captured = true;
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
    const wasCaptured = captured;
    captured = false;
    pointerId = -1;
    if (wasCaptured) {
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    if (dx > 0 && !opts.isOpen()) opts.onToggle(true);
    else if (dx < 0 && opts.isOpen()) opts.onToggle(false);
  };

  const onCancel = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    tracking = false;
    captured = false;
    pointerId = -1;
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onCancel);

  return () => {
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
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
 * Capture starts only after the drag threshold so hop clicks still navigate.
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
  };

  const onMove = (e: PointerEvent) => {
    if (!active || e.pointerId !== pointerId) return;
    const client = horizontal ? e.clientX : e.clientY;
    const delta = client - startClient;
    if (!dragging && Math.abs(delta) >= THRESHOLD) {
      dragging = true;
      scroller.classList.add('is-dragging');
      try {
        scroller.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
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

/**
 * Depth shadow at the Home|hop seam — rail chrome overlay (does not scroll with hops).
 *
 * Paint order: Home pin (body + overflowing tip) → shadow → scrolling hops.
 * Placement: leading edge on the pin’s rectangular trailing face; `.pe-home-tip`
 * overflows past that edge and paints above the band. Hops stay under the shadow.
 * Intensity: off when flush (underflow 0); ramps fast as the first hop slides under Home;
 * full effect by ~1/2 first-tile under (sooner via ease curve).
 */
export function syncPathDepthShadow(rail: HTMLElement, axis: PathEdgeAxis) {
  const shadow = rail.querySelector('.pe-depth-shadow') as HTMLElement | null;
  const scroller = rail.querySelector('.pe-scroll') as HTMLElement | null;
  const track = rail.querySelector('.pe-track') as HTMLElement | null;
  const pin =
    (rail.querySelector('.pe-home-pin') as HTMLElement | null) ??
    (rail.querySelector('.pe-home') as HTMLElement | null);
  if (!shadow || !scroller || !track || !pin) return;

  const firstHop = track.querySelector('.pe-seg') as HTMLElement | null;
  const scrollPos = axis === 'top' ? scroller.scrollLeft : scroller.scrollTop;
  const hopSize = firstHop
    ? axis === 'top'
      ? firstHop.offsetWidth
      : firstHop.offsetHeight
    : 0;
  const homeSize = axis === 'top' ? pin.offsetWidth : pin.offsetHeight;

  /* Full drama by ~halfway under the first hop; ease so strength arrives early. */
  const fullAt = Math.max(hopSize * 0.45, 1);
  const t = Math.min(1, Math.max(0, scrollPos / fullAt));
  const intensity = t <= 0 ? 0 : Math.min(1, Math.pow(t, 0.55));

  /* Tight band at the seam — fraction of Home / first hop, not of the whole rail. */
  const spanMax = Math.max(homeSize * 0.55, Math.min(hopSize * 0.32, homeSize * 0.9));
  const span = intensity <= 0 ? 0 : spanMax * (0.65 + 0.35 * intensity);

  shadow.style.setProperty('--pe-depth-i', String(intensity));
  shadow.style.opacity = intensity <= 0.001 ? '0' : String(intensity);

  if (axis === 'top') {
    /* Leading edge = pin rect trailing face; tip overflows above this band. */
    shadow.style.left = `${pin.offsetLeft + pin.offsetWidth}px`;
    shadow.style.top = '0';
    shadow.style.width = `${span}px`;
    shadow.style.height = '100%';
  } else {
    shadow.style.top = `${pin.offsetTop + pin.offsetHeight}px`;
    shadow.style.left = '0';
    shadow.style.height = `${span}px`;
    shadow.style.width = '100%';
  }
}

/** Prefer showing the current hop; ancestors may sit under the pinned Home. */
export function scrollPathToCurrent(scroller: HTMLElement, axis: PathEdgeAxis) {
  const here = scroller.querySelector('.pe-seg.is-here') as HTMLElement | null;
  if (!here) return;
  const inset = PE_TRAIL_END_INSET_PX;
  if (axis === 'top') {
    const max = scroller.scrollWidth - scroller.clientWidth;
    if (max <= 0) {
      scroller.scrollLeft = 0;
      return;
    }
    /* Align current with ~inset of foundation past its trailing edge. */
    const target = here.offsetLeft + here.offsetWidth + inset - scroller.clientWidth;
    scroller.scrollLeft = Math.max(0, Math.min(max, target));
  } else {
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 0) {
      scroller.scrollTop = 0;
      return;
    }
    const target = here.offsetTop + here.offsetHeight + inset - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(max, target));
  }
}
