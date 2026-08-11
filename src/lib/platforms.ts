export type Platform = {
  id: string;
  label: string;
  role: string;
  blurb: string;
  /** CSS HSL channels without `hsl()` — e.g. `210 55% 42%` */
  overlay: string;
  overlay2: string;
};

export const defaultPlatforms: Platform[] = [
  {
    id: 'mail',
    label: 'Mail',
    role: 'Messaging',
    blurb: 'Inbox as the skyscraper — local chrome stays local.',
    overlay: '210 55% 42%',
    overlay2: '200 40% 28%',
  },
  {
    id: 'drive',
    label: 'Drive',
    role: 'Storage',
    blurb: 'Files without stealing the entrypoint header.',
    overlay: '28 70% 42%',
    overlay2: '18 45% 28%',
  },
  {
    id: 'admin',
    label: 'Admin',
    role: 'Control plane',
    blurb: 'Directory and policy in their own overlay world.',
    overlay: '160 40% 36%',
    overlay2: '170 30% 22%',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    role: 'Infrastructure',
    blurb: 'Compute projects — same streets, different building.',
    overlay: '265 45% 42%',
    overlay2: '250 35% 26%',
  },
  {
    id: 'docs',
    label: 'Docs',
    role: 'Creation',
    blurb: 'Authoring with a stable chromatic identity.',
    overlay: '145 45% 34%',
    overlay2: '155 30% 22%',
  },
];

export function findPlatform(
  platforms: Platform[],
  id: string,
): Platform {
  return platforms.find((p) => p.id === id) ?? platforms[0];
}
