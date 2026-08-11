import {
  demoPath,
  depthOpacity,
  pathThrough,
  segmentWeights,
  type PathNode,
} from '../../lib/path-edge';

export type PathMode = 'rest' | 'live' | 'tint';

export type PathWorkshopOptions = {
  root: HTMLElement;
  mode?: PathMode;
};

type Pack = 'start' | 'end';

/**
 * Path Edge workshop: shared top/left length, two left packs,
 * weights persist on expand, optional live dock + tint hint.
 */
export function mountPathWorkshop(opts: PathWorkshopOptions) {
  const all = demoPath;
  const mode: PathMode = opts.mode ?? 'rest';
  let currentId = all[all.length - 1]!.id;
  let topLength = 72;
  let leftLength = 72;
  let expandedA = false;
  let expandedB = false;
  let focusFromRoot: number | null = null;
  let hint = { x: 0.15, y: 0.15 };

  const root = opts.root;
  const live = mode === 'live';
  const tint = mode === 'tint';

  function nodes(): PathNode[] {
    return pathThrough(currentId, all);
  }

  function applyWeights() {
    const list = nodes();
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const weights = segmentWeights(list.length, live ? focusFromRoot : null, live);
      stage.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
        const i = Number(el.dataset.fromRoot);
        const w = weights[i] ?? 1;
        el.style.flexGrow = String(w);
        el.style.flexShrink = '1';
        el.style.flexBasis = '0';
      });
    });
  }

  function setExpanded(which: 'a' | 'b', on: boolean) {
    if (which === 'a') expandedA = on;
    else expandedB = on;
    const stage = root.querySelector(`[data-stage="${which}"]`);
    stage?.classList.toggle('is-expanded', on);
    if (!on && !expandedA && !expandedB && !live) {
      focusFromRoot = null;
      applyWeights();
    }
  }

  function bindStage(stage: HTMLElement, which: 'a' | 'b') {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.addEventListener('pointerenter', () => setExpanded(which, true));
    rails.addEventListener('pointerleave', () => {
      setExpanded(which, false);
      if (!live) {
        focusFromRoot = null;
        applyWeights();
      }
    });
    rails.addEventListener('pointermove', (e) => {
      const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
      if (t) {
        const next = Number(t.dataset.fromRoot);
        if (next !== focusFromRoot && (live || expandedA || expandedB)) {
          focusFromRoot = next;
          applyWeights();
        }
      }
      if (tint) {
        const r = rails.getBoundingClientRect();
        hint = {
          x: (e.clientX - r.left) / Math.max(r.width, 1),
          y: (e.clientY - r.top) / Math.max(r.height, 1),
        };
        stage.style.setProperty('--hint-x', String(hint.x));
        stage.style.setProperty('--hint-y', String(hint.y));
      }
    });
  }

  function segs(list: PathNode[], axis: 'top' | 'left'): string {
    return [...list]
      .reverse()
      .map((n) => {
        const fromRoot = list.indexOf(n);
        const here = fromRoot === list.length - 1;
        const op = depthOpacity(fromRoot, list.length);
        return `
          <button type="button" class="pe-seg pe-seg-${axis} ${here ? 'is-here' : 'is-ancestor'}"
            data-goto="${n.id}" data-from-root="${fromRoot}"
            style="--seg:${n.color};--depth-op:${op}"
            title="${n.label} · ${n.role}">
            ${axis === 'top' ? `<span class="pe-label">${n.label}</span>` : `<span class="pe-mark" aria-hidden="true">${n.mark}</span>`}
          </button>`;
      })
      .join('');
  }

  function stageHtml(which: 'a' | 'b', leftPack: Pack, list: PathNode[], current: PathNode): string {
    const last = list[list.length - 1]!;
    return `
      <div class="pe-stage ${tint ? 'is-tint' : ''} ${live ? 'is-live' : ''}" data-stage="${which}"
        style="--top-length:${topLength}%;--left-length:${leftLength}%;--hint-x:0.15;--hint-y:0.15">
        <div class="pe-rails" data-rails>
          <button type="button" class="pe-corner" data-goto="${current.id}" title="${current.label}"
            style="--top-seg:${last.color};--left-seg:${last.color}">
            <span class="pe-corner-top"></span><span class="pe-corner-left"></span>
          </button>
          <div class="pe-top" role="toolbar" aria-label="Top path">
            <div class="pe-stack pe-stack-top">${segs(list, 'top')}</div>
            <div class="pe-slack" aria-hidden="true"></div>
          </div>
          <div class="pe-left pe-left-${leftPack}" role="toolbar" aria-label="Left path ${leftPack}">
            <div class="pe-stack pe-stack-left">${segs(list, 'left')}</div>
            <div class="pe-slack" aria-hidden="true"></div>
          </div>
        </div>
        <div class="cr-content pe-content">
          <h2>${current.label}</h2>
          <p class="meta">${which === 'a' ? 'Left packed from the top' : 'Left packed from the bottom'} · ${current.role}</p>
          <p>${current.blurb}</p>
        </div>
      </div>`;
  }

  function render() {
    const list = nodes();
    const current = list[list.length - 1]!;
    root.innerHTML = `
      <div class="cr-toolbar pe-toolbar">
        <label>Top length
          <input type="range" min="28" max="100" value="${topLength}" data-top-length />
          <span data-top-read>${topLength}%</span>
        </label>
        <label>Left length
          <input type="range" min="28" max="100" value="${leftLength}" data-left-length />
          <span data-left-read>${leftLength}%</span>
        </label>
      </div>
      <p class="pe-caption">Same left-length on both stages. Expand keeps rootward compression — it does not equalize the rail.</p>
      <div class="pe-duo">
        ${stageHtml('a', 'start', list, current)}
        ${stageHtml('b', 'end', list, current)}
      </div>
    `;

    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      bindStage(stage, stage.dataset.stage as 'a' | 'b');
    });

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.goto;
        if (!id) return;
        currentId = id;
        render();
      });
    });

    const topR = root.querySelector('[data-top-length]') as HTMLInputElement;
    const leftR = root.querySelector('[data-left-length]') as HTMLInputElement;
    topR.addEventListener('input', () => {
      topLength = Number(topR.value);
      root.querySelector('[data-top-read]')!.textContent = `${topLength}%`;
      root.querySelectorAll<HTMLElement>('[data-stage]').forEach((s) => {
        s.style.setProperty('--top-length', `${topLength}%`);
      });
    });
    leftR.addEventListener('input', () => {
      leftLength = Number(leftR.value);
      root.querySelector('[data-left-read]')!.textContent = `${leftLength}%`;
      root.querySelectorAll<HTMLElement>('[data-stage]').forEach((s) => {
        s.style.setProperty('--left-length', `${leftLength}%`);
      });
    });

    applyWeights();
  }

  render();
}
