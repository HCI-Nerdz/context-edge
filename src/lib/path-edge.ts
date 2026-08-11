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

/** Root = 1; each hop deeper gets more length. */
export function depthWeight(indexFromRoot: number): number {
  return indexFromRoot + 1;
}

/**
 * Rootward nodes shrink when the rail is full.
 * Optional dock amplify on the focused hop (macOS-dock-ish).
 */
export function segmentWeights(
  count: number,
  focusFromRoot: number | null,
  live: boolean,
): number[] {
  const base = Array.from({ length: count }, (_, i) => depthWeight(i));
  if (!live || focusFromRoot == null) return base;
  return base.map((w, i) => {
    const dist = Math.abs(i - focusFromRoot);
    if (dist === 0) return w * 2.6;
    if (dist === 1) return w * 1.2;
    return w * 0.62;
  });
}

/** Root most transparent; current most opaque. */
export function depthOpacity(indexFromRoot: number, count: number): number {
  if (count <= 1) return 1;
  return 0.22 + (0.78 * indexFromRoot) / (count - 1);
}
