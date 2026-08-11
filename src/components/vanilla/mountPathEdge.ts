import {
  BLEND_MODES,
  demoPath,
  depthShade,
  layoutRail,
  pathThrough,
  type BlendMode,
  type PathNode,
} from '../../lib/path-edge';

type Pack = 'start' | 'end';

type StageKind = 'color' | 'tint' | 'live' | 'tint-live';

const STAGES: { id: StageKind; tint: boolean; live: boolean; label: string }[] = [
  { id: 'color', tint: false, live: false, label: 'Color' },
  { id: 'tint', tint: true, live: false, label: 'Tint' },
  { id: 'live', tint: false, live: true, label: 'Live' },
  { id: 'tint-live', tint: true, live: true, label: 'Live Tint' },
];

/**
 * One workshop: 2×2 Color/Tint × Rest/Live, shared length + left-pack origin.
 */
export function mountPathWorkshop(opts: { root: HTMLElement }) {
  const all = demoPath;
  let currentId = all[all.length - 1]!.id;
  let topLength = 72;
  let leftLength = 72;
  let leftPack: Pack = 'start';
  let blend: BlendMode = 'color';
  let focusFromRoot: number | null = null;
  const expanded = new Set<StageKind>();
  let observer: ResizeObserver | null = null;

  const root = opts.root;

  function nodes(): PathNode[] {
    return pathThrough(currentId, all);
  }

  function remPx(n: number): number {
    return n * parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
  }

  function applyLayout() {
    const list = nodes();
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const live = stage.dataset.live === '1';
      const topRail = stage.querySelector('.pe-top') as HTMLElement;
      const leftRail = stage.querySelector('.pe-left') as HTMLElement;
      const topStack = stage.querySelector('.pe-stack-top') as HTMLElement;
      const leftStack = stage.querySelector('.pe-stack-left') as HTMLElement;
      if (!topRail || !leftRail || !topStack || !leftStack) return;

      const topBudget = topRail.clientWidth * (topLength / 100);
      const leftBudget = leftRail.clientHeight * (leftLength / 100);
      const topSizes = layoutRail({
        count: list.length,
        budget: topBudget,
        conventional: remPx(7.1),
        focusFromRoot: live ? focusFromRoot : null,
        live,
      });
      const leftSizes = layoutRail({
        count: list.length,
        budget: leftBudget,
        conventional: remPx(4.2),
        focusFromRoot: live ? focusFromRoot : null,
        live,
      });

      topStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
        const px = topSizes[Number(el.dataset.fromRoot)] ?? 0;
        el.style.flex = `0 0 ${px}px`;
      });
      leftStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
        const px = leftSizes[Number(el.dataset.fromRoot)] ?? 0;
        el.style.flex = `0 0 ${px}px`;
      });
    });
  }

  function applyPack() {
    root.querySelectorAll<HTMLElement>('.pe-left').forEach((left) => {
      left.dataset.pack = leftPack;
      const stack = left.querySelector('.pe-stack-left');
      const slack = left.querySelector('.pe-slack');
      if (!stack || !slack) return;
      if (leftPack === 'start') left.append(stack, slack);
      else left.append(slack, stack);
    });
    applyLayout();
  }

  function applyBlend() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      stage.style.setProperty('--blend', blend);
    });
  }

  function setExpanded(id: StageKind, on: boolean) {
    if (on) expanded.add(id);
    else expanded.delete(id);
    root.querySelector(`[data-stage="${id}"]`)?.classList.toggle('is-expanded', on);
    if (!on && expanded.size === 0) {
      focusFromRoot = null;
      applyLayout();
    }
  }

  function paintHint(stage: HTMLElement, e: PointerEvent) {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.querySelectorAll<HTMLElement>('.pe-seg, .pe-corner').forEach((el) => {
      const sr = el.getBoundingClientRect();
      el.style.setProperty('--local-x', `${e.clientX - sr.left}px`);
      el.style.setProperty('--local-y', `${e.clientY - sr.top}px`);
    });
  }

  function bindStage(stage: HTMLElement, kind: StageKind, live: boolean, tint: boolean) {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.addEventListener('pointerenter', (e) => {
      setExpanded(kind, true);
      if (tint) paintHint(stage, e as PointerEvent);
    });
    rails.addEventListener('pointerleave', () => {
      setExpanded(kind, false);
      if (!live) {
        focusFromRoot = null;
        applyLayout();
      }
    });
    rails.addEventListener('pointermove', (e) => {
      const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
      if (live && t) {
        const next = Number(t.dataset.fromRoot);
        if (next !== focusFromRoot) {
          focusFromRoot = next;
          applyLayout();
        }
      }
      if (tint) paintHint(stage, e);
    });
  }

  function segs(list: PathNode[], axis: 'top' | 'left', page: string): string {
    return [...list]
      .reverse()
      .map((n) => {
        const fromRoot = list.indexOf(n);
        const here = fromRoot === list.length - 1;
        const shade = depthShade(fromRoot, list.length);
        const mono = `color-mix(in srgb, ${page} 14%, hsl(0 0% ${Math.round(18 + shade * 42)}%))`;
        return `
          <button type="button" class="pe-seg pe-seg-${axis} ${here ? 'is-here' : 'is-ancestor'}"
            data-goto="${n.id}" data-from-root="${fromRoot}"
            style="--seg:${n.color};--mono:${mono}"
            title="${n.label} · ${n.role}">
            <span class="pe-seg-color" aria-hidden="true"></span>
            ${axis === 'top' ? `<span class="pe-label">${n.label}</span>` : `<span class="pe-mark" aria-hidden="true">${n.mark}</span>`}
          </button>`;
      })
      .join('');
  }

  function stageHtml(
    kind: StageKind,
    label: string,
    tint: boolean,
    live: boolean,
    list: PathNode[],
    current: PathNode,
  ): string {
    return `
      <article class="pe-cell" id="${kind}">
        <p class="pe-cell-label">${label}</p>
        <div class="pe-stage ${tint ? 'is-tint' : ''} ${live ? 'is-live' : ''}"
          data-stage="${kind}" data-live="${live ? '1' : '0'}"
          style="--top-length:${topLength}%;--left-length:${leftLength}%;--blend:${blend};--page:${current.color}">
          <div class="pe-rails" data-rails>
            <button type="button" class="pe-corner" data-goto="${current.id}" title="${current.label}"
              style="--top-seg:${current.color};--left-seg:${current.color};--mono-page:color-mix(in srgb, ${current.color} 16%, #3a4044)">
              <span class="pe-corner-color">
                <span class="pe-corner-top"></span><span class="pe-corner-left"></span>
              </span>
            </button>
            <div class="pe-top" role="toolbar" aria-label="${label} top path">
              <div class="pe-stack pe-stack-top">${segs(list, 'top', current.color)}</div>
              <div class="pe-slack" aria-hidden="true"></div>
            </div>
            <div class="pe-left" data-pack="${leftPack}" role="toolbar" aria-label="${label} left path">
              <div class="pe-stack pe-stack-left">${segs(list, 'left', current.color)}</div>
              <div class="pe-slack" aria-hidden="true"></div>
            </div>
          </div>
          <div class="cr-content pe-content">
            <h2>${current.label}</h2>
            <p class="meta">${current.role}</p>
            <p>${current.blurb}</p>
          </div>
        </div>
      </article>`;
  }

  function render() {
    observer?.disconnect();
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
        <label>Left pack
          <select data-pack>
            <option value="start"${leftPack === 'start' ? ' selected' : ''}>Top of left edge</option>
            <option value="end"${leftPack === 'end' ? ' selected' : ''}>Bottom of left edge</option>
          </select>
        </label>
        <label>Blend
          <select data-blend>
            ${BLEND_MODES.map((m) => `<option value="${m}"${m === blend ? ' selected' : ''}>${m}</option>`).join('')}
          </select>
        </label>
      </div>
      <p class="pe-caption">
        Conventional size until the length budget fills. Overflow hops share a reserved
        end-zone (log compression). Left sequence is always root→leaf, bottom to top —
        the pack only chooses whether that run sits at the top or the bottom of the edge.
        Tint stays monochrome until hover; the pointer reveals color only.
      </p>
      <div class="pe-quad">
        ${STAGES.map((s) => stageHtml(s.id, s.label, s.tint, s.live, list, current)).join('')}
      </div>
    `;

    applyPack();
    applyBlend();

    STAGES.forEach((s) => {
      const stage = root.querySelector(`[data-stage="${s.id}"]`) as HTMLElement | null;
      if (stage) {
        if (expanded.has(s.id)) stage.classList.add('is-expanded');
        bindStage(stage, s.id, s.live, s.tint);
      }
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
      applyLayout();
    });
    leftR.addEventListener('input', () => {
      leftLength = Number(leftR.value);
      root.querySelector('[data-left-read]')!.textContent = `${leftLength}%`;
      root.querySelectorAll<HTMLElement>('[data-stage]').forEach((s) => {
        s.style.setProperty('--left-length', `${leftLength}%`);
      });
      applyLayout();
    });

    root.querySelector('[data-pack]')!.addEventListener('change', (e) => {
      leftPack = (e.target as HTMLSelectElement).value as Pack;
      applyPack();
    });
    root.querySelector('[data-blend]')!.addEventListener('change', (e) => {
      blend = (e.target as HTMLSelectElement).value as BlendMode;
      applyBlend();
    });

    observer = new ResizeObserver(() => applyLayout());
    root.querySelectorAll('.pe-top, .pe-left').forEach((el) => observer!.observe(el));
    applyLayout();
  }

  render();
}
