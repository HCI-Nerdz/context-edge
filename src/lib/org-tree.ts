export type OrgNode = {
  id: string;
  label: string;
  role: string;
  blurb: string;
  mark: OrgMark;
  overlay: string;
  overlay2: string;
  accent: string;
  children?: OrgNode[];
};

export type OrgMark =
  | 'alphabet'
  | 'google'
  | 'search'
  | 'youtube'
  | 'yt-music'
  | 'android'
  | 'chrome'
  | 'maps'
  | 'workspace'
  | 'gmail'
  | 'drive'
  | 'docs'
  | 'calendar'
  | 'cloud'
  | 'compute'
  | 'storage'
  | 'bigquery'
  | 'gke'
  | 'ads'
  | 'pixel'
  | 'bets'
  | 'waymo'
  | 'verily'
  | 'wing'
  | 'deepmind'
  | 'x';

/** Public product hierarchy (Alphabet-shaped). Demo map, not an official org chart. */
export const alphabetTree: OrgNode = {
  id: 'alphabet',
  label: 'Alphabet',
  role: 'Holding company',
  blurb: 'The roof of the map — Google and the other bets sit under one holding company.',
  mark: 'alphabet',
  overlay: '220 12% 28%',
  overlay2: '220 10% 16%',
  accent: '#9aa0a6',
  children: [
    {
      id: 'google',
      label: 'Google',
      role: 'Consumer + cloud',
      blurb: 'Search, YouTube, Android, Workspace, Cloud — one company, many buildings.',
      mark: 'google',
      overlay: '217 89% 42%',
      overlay2: '217 70% 24%',
      accent: '#4285f4',
      children: [
        {
          id: 'search',
          label: 'Search',
          role: 'Query',
          blurb: 'The original skyscraper. Rails around it should not become more Search chrome.',
          mark: 'search',
          overlay: '217 89% 48%',
          overlay2: '217 70% 28%',
          accent: '#4285f4',
        },
        {
          id: 'youtube',
          label: 'YouTube',
          role: 'Video',
          blurb: 'A destination with its own world — not a tab painted on Search.',
          mark: 'youtube',
          overlay: '0 72% 42%',
          overlay2: '0 55% 24%',
          accent: '#ff0000',
          children: [
            {
              id: 'yt-music',
              label: 'YouTube Music',
              role: 'Audio',
              blurb: 'A child of YouTube, not another header language on the parent.',
              mark: 'yt-music',
              overlay: '0 72% 36%',
              overlay2: '350 40% 20%',
              accent: '#ff1744',
            },
            {
              id: 'yt-tv',
              label: 'YouTube TV',
              role: 'Live TV',
              blurb: 'Another floor in the YouTube building.',
              mark: 'youtube',
              overlay: '350 65% 34%',
              overlay2: '350 45% 20%',
              accent: '#d50000',
            },
          ],
        },
        {
          id: 'android',
          label: 'Android',
          role: 'OS',
          blurb: 'The phone OS is a platform, not a chip in the Search header.',
          mark: 'android',
          overlay: '88 50% 32%',
          overlay2: '100 35% 18%',
          accent: '#3ddc84',
        },
        {
          id: 'chrome',
          label: 'Chrome',
          role: 'Browser',
          blurb: 'A client surface with its own identity.',
          mark: 'chrome',
          overlay: '28 80% 42%',
          overlay2: '14 70% 28%',
          accent: '#fbbc04',
        },
        {
          id: 'maps',
          label: 'Maps',
          role: 'Geo',
          blurb: 'Places as their own world — streets in the product, and on this demo map.',
          mark: 'maps',
          overlay: '145 45% 32%',
          overlay2: '152 35% 18%',
          accent: '#34a853',
        },
        {
          id: 'workspace',
          label: 'Workspace',
          role: 'Productivity',
          blurb: 'Mail, Drive, Docs — a suite under Google, not a second Google header.',
          mark: 'workspace',
          overlay: '210 55% 38%',
          overlay2: '200 40% 22%',
          accent: '#1a73e8',
          children: [
            {
              id: 'gmail',
              label: 'Gmail',
              role: 'Mail',
              blurb: 'Inbox as the skyscraper — local chrome stays local.',
              mark: 'gmail',
              overlay: '4 72% 46%',
              overlay2: '0 50% 26%',
              accent: '#ea4335',
            },
            {
              id: 'drive',
              label: 'Drive',
              role: 'Files',
              blurb: 'Storage without stealing the entrypoint header.',
              mark: 'drive',
              overlay: '145 48% 34%',
              overlay2: '155 32% 20%',
              accent: '#34a853',
            },
            {
              id: 'docs',
              label: 'Docs',
              role: 'Writing',
              blurb: 'Authoring with a stable chromatic identity.',
              mark: 'docs',
              overlay: '217 80% 44%',
              overlay2: '217 55% 24%',
              accent: '#4285f4',
            },
            {
              id: 'calendar',
              label: 'Calendar',
              role: 'Time',
              blurb: 'Timekeeping as its own room in Workspace.',
              mark: 'calendar',
              overlay: '217 70% 40%',
              overlay2: '260 35% 24%',
              accent: '#4285f4',
            },
          ],
        },
        {
          id: 'cloud',
          label: 'Google Cloud',
          role: 'Infrastructure',
          blurb: 'Projects and resources — same streets, different building.',
          mark: 'cloud',
          overlay: '265 45% 42%',
          overlay2: '250 35% 26%',
          accent: '#669df6',
          children: [
            {
              id: 'compute',
              label: 'Compute Engine',
              role: 'VMs',
              blurb: 'Machines under Cloud, not tabs on the Cloud header.',
              mark: 'compute',
              overlay: '200 55% 36%',
              overlay2: '200 40% 20%',
              accent: '#5bb974',
            },
            {
              id: 'storage',
              label: 'Cloud Storage',
              role: 'Objects',
              blurb: 'Buckets live in Cloud’s building.',
              mark: 'storage',
              overlay: '28 70% 40%',
              overlay2: '18 45% 24%',
              accent: '#f9ab00',
            },
            {
              id: 'bigquery',
              label: 'BigQuery',
              role: 'Analytics',
              blurb: 'Warehouse as a floor, not a console skin.',
              mark: 'bigquery',
              overlay: '200 70% 38%',
              overlay2: '210 45% 22%',
              accent: '#669df6',
            },
            {
              id: 'gke',
              label: 'GKE',
              role: 'Containers',
              blurb: 'Clusters under Cloud.',
              mark: 'gke',
              overlay: '188 55% 32%',
              overlay2: '188 40% 18%',
              accent: '#24c1e0',
            },
          ],
        },
        {
          id: 'ads',
          label: 'Ads',
          role: 'Monetization',
          blurb: 'The ads plane is a sibling of Search, not a badge on every product.',
          mark: 'ads',
          overlay: '28 85% 42%',
          overlay2: '20 60% 24%',
          accent: '#fbbc04',
        },
        {
          id: 'pixel',
          label: 'Pixel',
          role: 'Hardware',
          blurb: 'Devices as their own shop on the street.',
          mark: 'pixel',
          overlay: '220 14% 30%',
          overlay2: '220 12% 16%',
          accent: '#e8eaed',
        },
      ],
    },
    {
      id: 'other-bets',
      label: 'Other Bets',
      role: 'Alphabet companies',
      blurb: 'Siblings of Google — same holding company, different buildings.',
      mark: 'bets',
      overlay: '260 18% 30%',
      overlay2: '260 14% 16%',
      accent: '#bdc1c6',
      children: [
        {
          id: 'waymo',
          label: 'Waymo',
          role: 'Autonomy',
          blurb: 'A separate company on the map, not a Google submenu.',
          mark: 'waymo',
          overlay: '200 70% 28%',
          overlay2: '200 50% 14%',
          accent: '#00bcd4',
        },
        {
          id: 'verily',
          label: 'Verily',
          role: 'Life sciences',
          blurb: 'Health research as its own node.',
          mark: 'verily',
          overlay: '160 35% 28%',
          overlay2: '160 25% 14%',
          accent: '#5bb974',
        },
        {
          id: 'wing',
          label: 'Wing',
          role: 'Delivery',
          blurb: 'Drones as another bet.',
          mark: 'wing',
          overlay: '200 45% 32%',
          overlay2: '200 30% 16%',
          accent: '#7baaf7',
        },
        {
          id: 'deepmind',
          label: 'Google DeepMind',
          role: 'Research',
          blurb: 'Research sits on the map as a place you go, not a banner.',
          mark: 'deepmind',
          overlay: '280 40% 34%',
          overlay2: '280 30% 18%',
          accent: '#c58af9',
        },
        {
          id: 'x',
          label: 'X',
          role: 'Moonshots',
          blurb: 'The factory for bets that are not yet companies.',
          mark: 'x',
          overlay: '220 8% 26%',
          overlay2: '220 8% 12%',
          accent: '#e8eaed',
        },
      ],
    },
  ],
};

export function flattenOrg(node: OrgNode = alphabetTree): OrgNode[] {
  return [node, ...(node.children ?? []).flatMap((c) => flattenOrg(c))];
}

export function findOrg(id: string, node: OrgNode = alphabetTree): OrgNode {
  return flattenOrg(node).find((n) => n.id === id) ?? node;
}

const logos: Record<OrgMark, string> = {
  alphabet: `<g fill="none"><circle cx="8" cy="8" r="3" fill="#ea4335"/><circle cx="16" cy="8" r="3" fill="#4285f4"/><circle cx="8" cy="16" r="3" fill="#fbbc04"/><circle cx="16" cy="16" r="3" fill="#34a853"/></g>`,
  google: `<g fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.3" stroke="#4285f4"/><path d="M12 12h9" stroke="#34a853"/><circle cx="12" cy="12" r="2" fill="#ea4335"/><path d="M7.5 18.2A9 9 0 0 1 5 12" stroke="#fbbc04"/></g>`,
  search: `<g fill="none" stroke="#e8eaed" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l5 5"/></g>`,
  youtube: `<g fill="none"><rect x="2" y="5" width="20" height="14" rx="3.5" fill="#ff0000"/><path d="M10 9l7 3.5L10 16V9z" fill="#fff"/></g>`,
  'yt-music': `<g fill="none"><circle cx="12" cy="12" r="9" fill="#ff1744"/><path d="M10 8.5v7l6-3.5-6-3.5z" fill="#fff"/></g>`,
  android: `<g fill="#3ddc84"><path d="M8 9h8v8.5a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9z"/><circle cx="9" cy="7" r="1.1"/><circle cx="15" cy="7" r="1.1"/><path d="M9 4.2 7.6 2.4M15 4.2l1.4-1.8" stroke="#3ddc84" stroke-width="1.4" fill="none" stroke-linecap="round"/><rect x="6" y="11" width="1.6" height="4.2" rx=".6"/><rect x="16.4" y="11" width="1.6" height="4.2" rx=".6"/></g>`,
  chrome: `<g><circle cx="12" cy="12" r="9" fill="#4285f4"/><path d="M12 12 20.4 9.2A9 9 0 0 0 6.4 6.4L12 12z" fill="#ea4335"/><path d="M12 12 6.4 6.4A9 9 0 0 0 8.8 19L12 12z" fill="#fbbc04"/><path d="M12 12 8.8 19A9 9 0 0 0 20.4 9.2L12 12z" fill="#34a853"/><circle cx="12" cy="12" r="3.4" fill="#fff"/><circle cx="12" cy="12" r="2.1" fill="#4285f4"/></g>`,
  maps: `<g fill="none"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" fill="#ea4335"/><circle cx="12" cy="10" r="2.4" fill="#fff"/></g>`,
  workspace: `<g><rect x="3" y="3" width="8" height="8" rx="1.2" fill="#4285f4"/><rect x="13" y="3" width="8" height="8" rx="1.2" fill="#ea4335"/><rect x="3" y="13" width="8" height="8" rx="1.2" fill="#fbbc04"/><rect x="13" y="13" width="8" height="8" rx="1.2" fill="#34a853"/></g>`,
  gmail: `<g fill="none"><path d="M3 7.2 12 13l9-5.8V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.2z" fill="#fff" opacity=".15"/><path d="M3 7.2 12 13l9-5.8" stroke="#ea4335" stroke-width="2.1" stroke-linecap="round"/><path d="M3 7.2V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2L12 13 3 7.2z" stroke="#ea4335" stroke-width="1.6"/></g>`,
  drive: `<g><path d="M8.2 4h7.6L20 12H12.4L8.2 4z" fill="#4285f4"/><path d="M4 20 8.2 4 12.4 12 8.2 20H4z" fill="#ea4335"/><path d="M12.4 12 20 12 15.8 20H8.2l4.2-8z" fill="#fbbc04"/></g>`,
  docs: `<g fill="none"><path d="M7 3h7l5 5v13a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 21V4.5A1.5 1.5 0 0 1 7 3z" fill="#4285f4"/><path d="M14 3v5h5" fill="#8ab4f8"/><path d="M8 13h8M8 16.5h6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></g>`,
  calendar: `<g fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="#4285f4"/><path d="M3.5 9h17" stroke="#8ab4f8" stroke-width="2"/><path d="M8 3.5v4M16 3.5v4" stroke="#e8eaed" stroke-width="1.6" stroke-linecap="round"/><text x="12" y="17" text-anchor="middle" fill="#fff" font-size="8" font-family="Segoe UI,sans-serif" font-weight="700">31</text></g>`,
  cloud: `<g fill="#669df6"><path d="M8 18h9.2a4.2 4.2 0 0 0 .6-8.4 5.4 5.4 0 0 0-10.3-1.4A4 4 0 0 0 8 18z"/></g>`,
  compute: `<g fill="none" stroke="#5bb974" stroke-width="1.6"><rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="10.5" width="16" height="5" rx="1"/><rect x="4" y="17" width="16" height="3.2" rx=".8"/><circle cx="7" cy="6.5" r=".8" fill="#5bb974"/><circle cx="7" cy="13" r=".8" fill="#5bb974"/></g>`,
  storage: `<g fill="none" stroke="#f9ab00" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></g>`,
  bigquery: `<g fill="#669df6"><rect x="4" y="13" width="3.2" height="7" rx=".5"/><rect x="9.4" y="8" width="3.2" height="12" rx=".5"/><rect x="14.8" y="4" width="3.2" height="16" rx=".5"/></g>`,
  gke: `<g fill="none" stroke="#24c1e0" stroke-width="1.6"><path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5z"/></g>`,
  ads: `<g fill="none" stroke="#fbbc04" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.4" fill="#fbbc04"/></g>`,
  pixel: `<g fill="none" stroke="#e8eaed" stroke-width="1.6"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><circle cx="12" cy="18.4" r="1"/></g>`,
  bets: `<g fill="#bdc1c6"><circle cx="7" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17" cy="12" r="2"/></g>`,
  waymo: `<g fill="#00bcd4"><path d="M4 16 12 4l8 12H4z"/><path d="M8.5 16 12 10l3.5 6H8.5z" fill="#062028"/></g>`,
  verily: `<g fill="#5bb974"><rect x="10.2" y="4" width="3.6" height="16" rx="1"/><rect x="4" y="10.2" width="16" height="3.6" rx="1"/></g>`,
  wing: `<g fill="none" stroke="#7baaf7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14 12 6l8 8"/><path d="M7 18 12 13l5 5"/></g>`,
  deepmind: `<g fill="#c58af9"><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><circle cx="12" cy="16" r="3"/></g>`,
  x: `<g fill="none" stroke="#e8eaed" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></g>`,
};

export function orgLogoSvg(mark: OrgMark): string {
  return `<svg class="cr-tree-svg" viewBox="0 0 24 24" aria-hidden="true">${logos[mark]}</svg>`;
}

export function orgIdFromEvent(target: EventTarget | null): string | undefined {
  const el = (target as Element | null)?.closest?.('[data-id]') as HTMLElement | null;
  return el?.dataset.id;
}

export function orgTreeHtml(currentId: string, node: OrgNode = alphabetTree): string {
  return `<div class="cr-tree-canvas">${orgBranchHtml(node, currentId)}</div>`;
}

function orgBranchHtml(node: OrgNode, currentId: string): string {
  const kids = node.children ?? [];
  const current = node.id === currentId ? ' is-current' : '';
  const kidsHtml = kids.length
    ? `<div class="cr-tree-kids">${kids.map((c) => orgBranchHtml(c, currentId)).join('')}</div>`
    : '';
  return `<div class="cr-tree-node">
    <button type="button" class="cr-tree-card${current}" data-id="${node.id}" style="--node:${node.accent}" title="${node.label} · ${node.role}">
      <span class="cr-tree-logo">${orgLogoSvg(node.mark)}</span>
      <span class="cr-tree-copy"><strong>${node.label}</strong><small>${node.role}</small></span>
    </button>
    ${kidsHtml}
  </div>`;
}
