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
    blurb: 'Another hop so the length budget can overflow and reserve an end zone.',
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

/** Root smallest; grows toward the leaf. Used only for hops that do not fit. */
export function logWeight(indexFromRoot: number): number {
  return Math.log2(2 + indexFromRoot);
}

function reservedForOverflow(overflow: number, minSliver: number): number {
  if (overflow <= 0) return 0;
  let w = 0;
  for (let i = 0; i < overflow; i++) w += logWeight(i);
  return Math.max(overflow * minSliver, w * minSliver);
}

function dockSizes(sizes: number[], focus: number): number[] {
  if (focus < 0 || focus >= sizes.length) return sizes;
  const next = sizes.slice();
  const extra = next[focus]! * 0.85;
  next[focus]! += extra;
  const others = next.reduce((s, v, i) => s + (i === focus ? 0 : v), 0);
  if (others <= 0) return sizes;
  for (let i = 0; i < next.length; i++) {
    if (i === focus) continue;
    next[i] = Math.max(4, next[i]! - extra * (sizes[i]! / others));
  }
  return next;
}

/**
 * Live: equal conventional shares (uniform shrink if the budget is tight),
 * then dock-zoom the focused hop and shrink the rest. No log compression.
 */
export function layoutLiveRail(opts: {
  count: number;
  budget: number;
  conventional: number;
  focusFromRoot?: number | null;
}): number[] {
  const count = Math.max(0, Math.floor(opts.count));
  const budget = Math.max(0, opts.budget);
  const conventional = Math.max(1, opts.conventional);
  if (count === 0) return [];
  const unit = Math.min(conventional, budget / count);
  const sizes = Array.from({ length: count }, () => unit);
  if (opts.focusFromRoot != null) return dockSizes(sizes, opts.focusFromRoot);
  return sizes;
}

/**
 * Rest: leafward hops keep a conventional size. Only hops that would run off
 * the length budget share a reserved end-zone, weighted by log(depth).
 */
export function layoutRail(opts: {
  count: number;
  budget: number;
  conventional: number;
  focusFromRoot?: number | null;
  minSliver?: number;
}): number[] {
  const count = Math.max(0, Math.floor(opts.count));
  const budget = Math.max(0, opts.budget);
  const conventional = Math.max(1, opts.conventional);
  const minSliver = opts.minSliver ?? 6;
  if (count === 0) return [];

  let full = 0;
  for (let k = count; k >= 0; k--) {
    if (k * conventional + reservedForOverflow(count - k, minSliver) <= budget + 0.5) {
      full = k;
      break;
    }
  }

  const overflow = count - full;
  const sizes = new Array<number>(count).fill(0);
  for (let i = overflow; i < count; i++) sizes[i] = conventional;

  if (overflow > 0) {
    const pool = Math.max(budget - full * conventional, reservedForOverflow(overflow, minSliver));
    const weights = Array.from({ length: overflow }, (_, i) => logWeight(i));
    const wsum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < overflow; i++) {
      sizes[i] = (weights[i]! / wsum) * pool;
    }
  }

  return sizes;
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

export function namePathHops(stage: HTMLElement, sid: string) {
  const corner = stage.querySelector('.pe-corner') as HTMLElement | null;
  if (corner) corner.style.viewTransitionName = `pe-${sid}-corner`;
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

export function remPx(n: number): number {
  return n * parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
}

/** Size path stacks from the shared L geometry (same idle/hover as Map / Modal). */
export function sizePathStacks(opts: {
  stage: HTMLElement;
  count: number;
  live: boolean;
  focusFromRoot: number | null;
  topLength?: number;
  leftLength?: number;
}) {
  const topRail = opts.stage.querySelector('.pe-top') as HTMLElement | null;
  const leftRail = opts.stage.querySelector('.pe-left') as HTMLElement | null;
  const topStack = opts.stage.querySelector('.pe-stack-top') as HTMLElement | null;
  const leftStack = opts.stage.querySelector('.pe-stack-left') as HTMLElement | null;
  if (!topRail || !leftRail || !topStack || !leftStack) return;

  const topPct = opts.topLength ?? 72;
  const leftPct = opts.leftLength ?? 72;
  const layout = opts.live ? layoutLiveRail : layoutRail;
  const topSizes = layout({
    count: opts.count,
    budget: topRail.clientWidth * (topPct / 100),
    conventional: remPx(7.1),
    focusFromRoot: opts.live ? opts.focusFromRoot : null,
  });
  const leftSizes = layout({
    count: opts.count,
    budget: leftRail.clientHeight * (leftPct / 100),
    conventional: remPx(4.2),
    focusFromRoot: opts.live ? opts.focusFromRoot : null,
  });

  topStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
    el.style.flex = `0 0 ${topSizes[Number(el.dataset.fromRoot)] ?? 0}px`;
  });
  leftStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
    el.style.flex = `0 0 ${leftSizes[Number(el.dataset.fromRoot)] ?? 0}px`;
  });
}
