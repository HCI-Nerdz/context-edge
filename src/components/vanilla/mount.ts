import {
  defaultPlatforms,
  findPlatform,
  type Platform,
} from '../../lib/platforms';

export type MountOptions = {
  root: HTMLElement;
  platforms?: Platform[];
  initialId?: string;
  title?: string;
};

export function mountVanillaRails(opts: MountOptions) {
  const platforms = opts.platforms ?? defaultPlatforms;
  let activeId = opts.initialId ?? 'admin';
  let navOpen = false;

  const root = opts.root;

  function render() {
    const active = findPlatform(platforms, activeId);
    root.innerHTML = `
      <div class="cr-toolbar">
        <span>Vanilla island · mature color-only rails · ${
          navOpen ? 'nav open' : 'rails idle'
        } · ${active.label}</span>
      </div>
      <div class="cr-stage mature" style="--overlay:${active.overlay};--overlay-2:${active.overlay2}">
        <button type="button" class="cr-rail cr-rail-top" data-open aria-label="Open ecosystem navigation">
          <span class="cr-rail-label">Ecosystem</span>
        </button>
        <button type="button" class="cr-rail cr-rail-left" data-open aria-label="Open platform navigation">
          <span class="cr-rail-label">Platforms</span>
        </button>
        <div class="cr-content">
          <h2>${opts.title ?? active.label}</h2>
          <p class="meta">Mature system · label optional · ${active.role}</p>
          <p>${active.blurb}</p>
          <p>
            In a mature system the bar’s presence and color are enough — no label required.
            Click still opens the wireframe map.
          </p>
        </div>
        ${
          navOpen
            ? `<div class="cr-overlay" data-backdrop>
          <div class="cr-panel" role="dialog" aria-modal="true">
            <header>
              <h3>Wireframe ecosystem nav</h3>
              <button type="button" class="close" data-close>Close</button>
            </header>
            <div class="cr-wire">
              ${platforms
                .map(
                  (p) => `<button type="button" data-id="${p.id}" class="${
                    p.id === activeId ? 'current' : ''
                  }"><strong>${p.label}</strong><small>${p.role}</small></button>`,
                )
                .join('')}
            </div>
          </div>
        </div>`
            : ''
        }
      </div>
    `;

    root.querySelectorAll('[data-open]').forEach((el) => {
      el.addEventListener('click', () => {
        navOpen = true;
        render();
      });
    });
    root.querySelector('[data-close]')?.addEventListener('click', () => {
      navOpen = false;
      render();
    });
    root.querySelector('[data-backdrop]')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        navOpen = false;
        render();
      }
    });
    root.querySelectorAll('.cr-wire button[data-id]').forEach((el) => {
      el.addEventListener('click', () => {
        activeId = (el as HTMLElement).dataset.id ?? activeId;
        navOpen = false;
        render();
      });
    });
  }

  render();
}
