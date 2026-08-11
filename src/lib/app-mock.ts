import { orgLogoSvg, type OrgNode } from './org-tree';

export type AppSkin =
  | 'holding'
  | 'search'
  | 'mail'
  | 'drive'
  | 'docs'
  | 'calendar'
  | 'cloud'
  | 'youtube'
  | 'maps'
  | 'android'
  | 'chrome'
  | 'ads'
  | 'pixel'
  | 'bets';

const skins: Record<string, AppSkin> = {
  alphabet: 'holding',
  google: 'holding',
  search: 'search',
  youtube: 'youtube',
  'yt-music': 'youtube',
  'yt-tv': 'youtube',
  gmail: 'mail',
  workspace: 'mail',
  drive: 'drive',
  docs: 'docs',
  calendar: 'calendar',
  cloud: 'cloud',
  compute: 'cloud',
  storage: 'cloud',
  bigquery: 'cloud',
  gke: 'cloud',
  maps: 'maps',
  android: 'android',
  chrome: 'chrome',
  ads: 'ads',
  pixel: 'pixel',
  'other-bets': 'bets',
  waymo: 'bets',
  verily: 'bets',
  wing: 'bets',
  deepmind: 'bets',
  x: 'bets',
};

export function nodeSkin(id: string): AppSkin {
  return skins[id] ?? 'holding';
}

export function appMockHtml(node: OrgNode): string {
  const skin = nodeSkin(node.id);
  const logo = orgLogoSvg(node.mark);
  return `<div class="cr-app cr-app-${skin}" data-skin="${skin}">
    ${mockBody(skin, node, logo)}
  </div>`;
}

function mockBody(skin: AppSkin, node: OrgNode, logo: string): string {
  switch (skin) {
    case 'search':
      return `
        <div class="cr-mock-search">
          <div class="cr-mock-search-brand">${logo}<span>${node.label}</span></div>
          <div class="cr-mock-search-box"><i></i><span>northwind-prod kubernetes quota</span></div>
          <ol class="cr-mock-results">
            <li><em>Compute Engine documentation</em><small>https://cloud.example/compute</small><b>VM families, quotas, and committed use for ${node.label}.</b></li>
            <li><em>${node.label} status</em><small>https://status.example</small><b>All systems nominal · last incident 14 days ago.</b></li>
          </ol>
        </div>`;
    case 'mail':
      return `
        <div class="cr-mock-mail">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
            <span class="cr-mock-find">Search mail</span>
          </header>
          <div class="cr-mock-mail-split">
            <aside>
              <b>Compose</b>
              <span class="is-on">Inbox 12</span>
              <span>Starred</span>
              <span>Sent</span>
              <span>Drafts</span>
            </aside>
            <div class="cr-mock-inbox">
              ${inboxRow('Northwind', 'Q2 planning doc', 'Can you review the rail proposal before Thursday?')}
              ${inboxRow('Priya S.', 'Cloud quota', 'GKE project northwind-prod is near the CPU cap.')}
              ${inboxRow('Calendar', 'Hold: design critique', 'Tue 2:00–2:45 · Meet link inside')}
              ${inboxRow('Drive', 'Shared with you', 'Context rails — mockups (folder)')}
            </div>
          </div>
        </div>`;
    case 'drive':
      return `
        <div class="cr-mock-drive">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
            <span class="cr-mock-find">Search Drive</span>
          </header>
          <div class="cr-mock-files">
            ${fileCard('Q2 Growth Plan', 'Docs · yesterday')}
            ${fileCard('Rail motion tests', 'Folder · 12 items')}
            ${fileCard('northwind-prod.tf', 'Text · Jun 2')}
            ${fileCard('Screenshot 08-10', 'Image · today')}
            ${fileCard('Budget FY26', 'Sheets · Mon')}
            ${fileCard('Launch checklist', 'Docs · last week')}
          </div>
        </div>`;
    case 'docs':
      return `
        <div class="cr-mock-docs">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
            <span>File</span><span>Edit</span><span>Insert</span>
          </header>
          <article class="cr-mock-paper">
            <h3>${node.label === 'Docs' ? 'Q2 Growth Plan' : node.label}</h3>
            <p class="cr-mock-paper-meta">Shared with 6 people · Heading 1</p>
            <p>Keep the activity plane. Ecosystem travel lives under the page, not in another header strip.</p>
            <p class="cr-mock-fade">Hover either edge of the L. Click and this sheet leaves so the map can be the street level.</p>
          </article>
        </div>`;
    case 'calendar':
      return `
        <div class="cr-mock-cal">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
            <span>August 2026</span>
          </header>
          <div class="cr-mock-month">
            ${'SMTWTFS'.split('').map((d) => `<span class="cr-mock-dow">${d}</span>`).join('')}
            ${monthCells()}
          </div>
        </div>`;
    case 'cloud':
      return `
        <div class="cr-mock-cloud">
          <header class="cr-mock-top cr-mock-top-cloud">
            ${logo}<strong>${node.label}</strong>
            <span class="cr-mock-proj">northwind-prod ▾</span>
          </header>
          <div class="cr-mock-cloud-body">
            <aside>
              <span class="is-on">Dashboard</span>
              <span>Compute</span>
              <span>Storage</span>
              <span>Kubernetes</span>
              <span>IAM</span>
            </aside>
            <div>
              <h3>Resources</h3>
              <table class="cr-mock-table">
                <thead><tr><th>Name</th><th>Type</th><th>Zone</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>api-1</td><td>VM</td><td>us-central1-a</td><td>Running</td></tr>
                  <tr><td>workers</td><td>GKE</td><td>us-central1</td><td>Healthy</td></tr>
                  <tr><td>assets</td><td>Bucket</td><td>—</td><td>Live</td></tr>
                  <tr><td>events</td><td>BigQuery</td><td>US</td><td>Idle</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`;
    case 'youtube':
      return `
        <div class="cr-mock-yt">
          <header class="cr-mock-top cr-mock-top-yt">
            ${logo}<strong>${node.label}</strong>
            <span class="cr-mock-find cr-mock-find-dark">Search</span>
          </header>
          <div class="cr-mock-vids">
            ${vidCard('Why edges beat header overload', 'HCI Nerdz · 12K views')}
            ${vidCard('Northwind architecture review', 'Cloud talks · 4.1K views')}
            ${vidCard('Live: product map walkthrough', 'Design desk · 88 watching')}
            ${vidCard('Android 16 gestures, recut', 'Pixel · 40K views')}
          </div>
        </div>`;
    case 'maps':
      return `
        <div class="cr-mock-maps">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
            <span class="cr-mock-find">Search maps</span>
          </header>
          <div class="cr-mock-mapcanvas" aria-hidden="true">
            <i class="rd r1"></i><i class="rd r2"></i><i class="rd r3"></i>
            <i class="park"></i><i class="pin"></i>
            <span class="cr-mock-maplabel">Market St · 2 min</span>
          </div>
        </div>`;
    case 'android':
      return `
        <div class="cr-mock-android">
          <header class="cr-mock-top cr-mock-top-droid">
            ${logo}<strong>${node.label}</strong>
          </header>
          <ul class="cr-mock-settings">
            <li>Network & internet</li>
            <li>Connected devices</li>
            <li>Apps</li>
            <li>Notifications</li>
            <li>Display</li>
            <li>Security</li>
          </ul>
        </div>`;
    case 'chrome':
      return `
        <div class="cr-mock-chrome">
          <div class="cr-mock-tabs">
            <span class="is-on">${node.label}</span>
            <span>Docs</span>
            <span>+</span>
          </div>
          <div class="cr-mock-omnibox">https://${node.id}.example/</div>
          <div class="cr-mock-ntp">
            ${logo}
            <p>New tab · ${node.role}</p>
            <div class="cr-mock-shortcuts" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
        </div>`;
    case 'ads':
      return `
        <div class="cr-mock-ads">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
          </header>
          <div class="cr-mock-ads-body">
            <div class="cr-mock-kpis">
              <div><small>Spend</small><b>$48.2k</b></div>
              <div><small>Clicks</small><b>126k</b></div>
              <div><small>Conv.</small><b>3.4%</b></div>
            </div>
            <div class="cr-mock-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </div>
        </div>`;
    case 'pixel':
      return `
        <div class="cr-mock-pixel">
          <header class="cr-mock-top cr-mock-top-dark">
            ${logo}<strong>${node.label}</strong>
          </header>
          <div class="cr-mock-hero">
            <div class="cr-mock-phone" aria-hidden="true"></div>
            <div>
              <h3>Pixel</h3>
              <p>Hardware as its own shop — not a link in someone else’s header.</p>
              <span class="cr-mock-buy">Learn more</span>
            </div>
          </div>
        </div>`;
    case 'bets':
      return `
        <div class="cr-mock-bets">
          <header class="cr-mock-top cr-mock-top-bets">
            ${logo}<strong>${node.label}</strong>
          </header>
          <div class="cr-mock-betbody">
            <p class="cr-mock-kicker">${node.role}</p>
            <h3>${node.label}</h3>
            <p>${node.blurb}</p>
          </div>
        </div>`;
    default:
      return `
        <div class="cr-mock-hold">
          <header class="cr-mock-top cr-mock-top-light">
            ${logo}<strong>${node.label}</strong>
          </header>
          <div class="cr-mock-holdbody">
            <p class="cr-mock-kicker">${node.role}</p>
            <h3>${node.label}</h3>
            <p>${node.blurb}</p>
            <ul>
              <li>Google</li>
              <li>Other Bets</li>
            </ul>
          </div>
        </div>`;
  }
}

function inboxRow(from: string, sub: string, preview: string): string {
  return `<button type="button" class="cr-mock-row"><b>${from}</b><em>${sub}</em><span>${preview}</span></button>`;
}

function fileCard(name: string, meta: string): string {
  return `<div class="cr-mock-file"><i></i><strong>${name}</strong><small>${meta}</small></div>`;
}

function vidCard(title: string, meta: string): string {
  return `<div class="cr-mock-vid"><i></i><strong>${title}</strong><small>${meta}</small></div>`;
}

function monthCells(): string {
  const start = 6;
  return Array.from({ length: 31 + start }, (_, i) => {
    if (i < start) return '<span></span>';
    const d = i - start + 1;
    const on = d === 11 ? ' is-on' : '';
    return `<span class="cr-mock-day${on}">${d}</span>`;
  }).join('');
}
