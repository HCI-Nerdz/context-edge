export type NavNode = {
  id: string;
  label: string;
  role: string;
  blurb: string;
  /** CSS HSL channels without hsl() */
  overlay: string;
  overlay2: string;
};

/** Demo ancestry path: suite → platform → project → resource (current). */
export const demoAncestry: NavNode[] = [
  {
    id: 'suite',
    label: 'Suite home',
    role: 'Root',
    blurb: 'Top of the ecosystem — the ground floor of the stack.',
    overlay: '220 18% 28%',
    overlay2: '220 12% 18%',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    role: 'Platform',
    blurb: 'Platform layer — still under the suite, above any project.',
    overlay: '265 45% 42%',
    overlay2: '250 35% 26%',
  },
  {
    id: 'project',
    label: 'northwind-prod',
    role: 'Project',
    blurb: 'A project modal on Cloud — waiting on nothing yet, but stacked above it.',
    overlay: '28 70% 42%',
    overlay2: '18 45% 28%',
  },
  {
    id: 'vm',
    label: 'web-01',
    role: 'Resource',
    blurb: 'Current activity — the top-most sheet, like a dialog over the path that led here.',
    overlay: '160 40% 36%',
    overlay2: '170 30% 22%',
  },
];

export function stackThrough(id: string, all: NavNode[] = demoAncestry): NavNode[] {
  const i = all.findIndex((n) => n.id === id);
  if (i < 0) return all.slice(0, 1);
  return all.slice(0, i + 1);
}
