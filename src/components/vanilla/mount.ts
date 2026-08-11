import {
  defaultMapVtStyle,
  isMapVtStyle,
  mapVtStyles,
  runMapViewTransition,
  type MapVtStyle,
} from '../../lib/map-vt';
import { appMockHtml, nodeSkin } from '../../lib/app-mock';
import { findOrg, orgIdFromEvent, orgTreeHtml } from '../../lib/org-tree';
import { themeSwitchHtml } from '../../lib/theme';

export type MountOptions = {
  root: HTMLElement;
  initialId?: string;
  title?: string;
};

export function mountVanillaRails(opts: MountOptions) {
  let activeId = opts.initialId ?? 'cloud';
  let navOpen = false;
  let vtStyle: MapVtStyle = defaultMapVtStyle;

  const root = opts.root;

  function stageEl(): HTMLElement | null {
    return root.querySelector('.cr-stage');
  }

  function applyReveal() {
    const stage = stageEl();
    const map = root.querySelector('.cr-map');
    stage?.classList.toggle('is-revealed', navOpen);
    map?.setAttribute('aria-hidden', navOpen ? 'false' : 'true');
  }

  function scrollCurrent() {
    root.querySelector('.cr-tree-card.is-current')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }

  function applyVtStyle() {
    const stage = stageEl();
    if (stage) stage.dataset.crVt = vtStyle;
    root.querySelectorAll<HTMLButtonElement>('[data-vt]').forEach((btn) => {
      btn.classList.toggle('is-current', btn.dataset.vt === vtStyle);
    });
  }

  function reveal(open: boolean) {
    const stage = stageEl();
    if (!stage) {
      navOpen = open;
      applyReveal();
      return;
    }
    void runMapViewTransition(stage, vtStyle, () => {
      navOpen = open;
      applyReveal();
    }).then(() => {
      if (navOpen) scrollCurrent();
    });
  }

  function render() {
    const active = findOrg(activeId);
    root.innerHTML = `
      <div class="cr-toolbar">
        <span>Vanilla island · ${navOpen ? 'map open' : 'rails idle'} · ${active.label}</span>
        ${themeSwitchHtml()}
        <nav class="variant-switch" aria-label="Transition style">
          <span class="variant-switch-name">Transition style</span>
          <div class="variant-switch-track" role="radiogroup" aria-label="Transition style">
            ${mapVtStyles
              .map(
                (s) => `
              <button type="button" class="variant-switch-item${
                s.id === vtStyle ? ' is-current' : ''
              }" data-vt="${s.id}" role="radio" aria-checked="${s.id === vtStyle}">
                ${s.label}
              </button>`,
              )
              .join('')}
          </div>
        </nav>
      </div>
      <div
        class="cr-stage${navOpen ? ' is-revealed' : ''}"
        data-cr-vt="${vtStyle}"
        style="--overlay:${active.overlay};--overlay-2:${active.overlay2}"
      >
        <div class="cr-map" aria-hidden="${navOpen ? 'false' : 'true'}">
          <div class="cr-map-head">
            <h2>Ecosystem map</h2>
            <button type="button" class="close" data-close>Back</button>
          </div>
          <p class="meta">Alphabet / Google product tree · demo map, not an official org chart</p>
          <div class="cr-tree">${orgTreeHtml(activeId)}</div>
        </div>
        <div class="cr-sheet" data-skin="${nodeSkin(active.id)}">
          <button type="button" class="cr-rail cr-rail-corner" data-open aria-label="Open ecosystem navigation"></button>
          <button type="button" class="cr-rail cr-rail-top" data-open aria-label="Open ecosystem navigation">
            <span class="cr-rail-label">Ecosystem</span>
          </button>
          <button type="button" class="cr-rail cr-rail-left" data-open aria-label="Open platform navigation">
            <span class="cr-rail-label">Platforms</span>
          </button>
          ${appMockHtml(active)}
        </div>
      </div>
    `;

    root.querySelectorAll('[data-open]').forEach((el) => {
      el.addEventListener('click', () => reveal(true));
    });
    root.querySelectorAll('[data-close]').forEach((el) => {
      el.addEventListener('click', () => reveal(false));
    });
    root.querySelector('.cr-tree')?.addEventListener('click', (e) => {
      const next = orgIdFromEvent(e.target);
      if (!next) return;
      const stage = stageEl();
      const go = () => {
        activeId = next;
        navOpen = false;
        render();
      };
      if (stage) void runMapViewTransition(stage, vtStyle, go);
      else go();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-vt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!isMapVtStyle(btn.dataset.vt)) return;
        vtStyle = btn.dataset.vt;
        applyVtStyle();
        root.querySelectorAll<HTMLButtonElement>('[data-vt]').forEach((b) => {
          b.setAttribute('aria-checked', b.dataset.vt === vtStyle ? 'true' : 'false');
        });
      });
    });
  }

  render();
}
