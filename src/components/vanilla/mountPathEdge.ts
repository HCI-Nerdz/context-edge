import {
  BLEND_MODES,
  demoPath,
  depthShade,
  layoutLiveRail,
  layoutRail,
  pathThrough,
  type BlendMode,
  type PathNode,
} from '../../lib/path-edge';

type Pack = 'start' | 'end';

type StageKind = 'color' | 'subtle' | 'live' | 'live-subtle';

const STAGES: { id: StageKind; subtle: boolean; live: boolean; label: string }[] = [
  { id: 'color', subtle: false, live: false, label: 'Color' },
  { id: 'subtle', subtle: true, live: false, label: 'Subtle' },
  { id: 'live', subtle: false, live: true, label: 'Live' },
  { id: 'live-subtle', subtle: true, live: true, label: 'Live Subtle' },
];

function blendButtons(active: BlendMode, which: 'color' | 'subtle'): string {
  return `
    <div class="mode-btns" role="group" aria-label="${which} blend" data-blend-for="${which}">
      ${BLEND_MODES.map(
        (m) => `
        <button type="button" class="mode-btn${m === active ? ' is-on' : ''}" data-blend="${m}">
          ${m}
        </button>`,
      ).join('')}
    </div>`;
}

export function mountPathWorkshop(opts: { root: HTMLElement }) {
  const all = demoPath;
  let currentId = all[all.length - 1]!.id;
  let topLength = 72;
  let leftLength = 72;
  let leftPack: Pack = 'start';
  let blendColor: BlendMode = 'normal';
  let blendSubtle: BlendMode = 'color';
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
      const layout = live ? layoutLiveRail : layoutRail;
      const topSizes = layout({
        count: list.length,
        budget: topBudget,
        conventional: remPx(7.1),
        focusFromRoot: live ? focusFromRoot : null,
      });
      const leftSizes = layout({
        count: list.length,
        budget: leftBudget,
        conventional: remPx(4.2),
        focusFromRoot: live ? focusFromRoot : null,
      });

      topStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
        el.style.flex = `0 0 ${topSizes[Number(el.dataset.fromRoot)] ?? 0}px`;
      });
      leftStack.querySelectorAll<HTMLElement>('[data-from-root]').forEach((el) => {
        el.style.flex = `0 0 ${leftSizes[Number(el.dataset.fromRoot)] ?? 0}px`;
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
    root.querySelectorAll<HTMLButtonElement>('[data-pack]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.dataset.pack === leftPack);
    });
    applyLayout();
  }

  function applyBlends() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const subtle = stage.classList.contains('is-tint');
      stage.style.setProperty('--blend', subtle ? blendSubtle : blendColor);
    });
    root.querySelectorAll<HTMLElement>('[data-blend-for]').forEach((group) => {
      const which = group.dataset.blendFor;
      const active = which === 'subtle' ? blendSubtle : blendColor;
      group.querySelectorAll<HTMLButtonElement>('[data-blend]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.blend === active);
      });
    });
  }

  function previewBlend(which: 'color' | 'subtle', mode: BlendMode | null) {
    const ids: StageKind[] = which === 'subtle' ? ['subtle', 'live-subtle'] : ['color', 'live'];
    ids.forEach((id) => {
      const stage = root.querySelector(`[data-stage="${id}"]`) as HTMLElement | null;
      if (!stage) return;
      if (mode) {
        stage.style.setProperty('--blend', mode);
        stage.classList.add('is-expanded', 'is-blend-preview');
      } else {
        stage.style.setProperty('--blend', which === 'subtle' ? blendSubtle : blendColor);
        stage.classList.remove('is-blend-preview');
        if (!expanded.has(id)) stage.classList.remove('is-expanded');
      }
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

  function runPathVt(update: () => void) {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition !== 'function') {
      update();
      return;
    }
    doc.documentElement.classList.add('pe-path-vt');
    const t = doc.startViewTransition(update);
    void t.finished.finally(() => doc.documentElement.classList.remove('pe-path-vt'));
  }

  function nameHops() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const sid = stage.dataset.stage ?? '';
      const corner = stage.querySelector('.pe-corner') as HTMLElement | null;
      if (corner) corner.style.viewTransitionName = `pe-${sid}-corner`;
      const copy = stage.querySelector('.pe-content') as HTMLElement | null;
      if (copy) copy.style.viewTransitionName = `pe-${sid}-copy`;
      stage.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const axis = el.classList.contains('pe-seg-top') ? 'top' : 'left';
        el.style.viewTransitionName = `pe-${sid}-${axis}-${el.dataset.goto}`;
      });
    });
  }

  function markLeaves(nextId: string) {
    const keep = new Set(pathThrough(nextId, all).map((n) => n.id));
    root.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
      const id = el.dataset.goto ?? '';
      const leaf = !keep.has(id);
      const axis = el.classList.contains('pe-seg-top') ? 'top' : 'left';
      el.style.viewTransitionClass = leaf
        ? `pe-leaf pe-leaf-${axis}`
        : 'pe-keep';
    });
  }

  function applyPath(nextId: string) {
    currentId = nextId;
    const list = nodes();
    const current = list[list.length - 1]!;
    const keep = new Set(list.map((n) => n.id));
    const monoTop = `color-mix(in srgb, ${current.color} 18%, hsl(0 0% 42%))`;
    const monoLeft = `color-mix(in srgb, ${current.color} 14%, hsl(0 0% 28%))`;

    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      stage.style.setProperty('--page', current.color);
      stage.style.setProperty('--mono-top', monoTop);
      stage.style.setProperty('--mono-left', monoLeft);
      const corner = stage.querySelector('.pe-corner') as HTMLElement | null;
      if (corner) {
        corner.dataset.goto = current.id;
        corner.title = current.label;
        corner.style.setProperty('--top-seg', current.color);
        corner.style.setProperty('--left-seg', current.color);
      }
      const h2 = stage.querySelector('.pe-content h2');
      const meta = stage.querySelector('.pe-content .meta');
      const blurb = stage.querySelector('.pe-content p:last-of-type');
      if (h2) h2.textContent = current.label;
      if (meta) meta.textContent = current.role;
      if (blurb) blurb.textContent = current.blurb;

      stage.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const id = el.dataset.goto ?? '';
        if (!keep.has(id)) {
          el.remove();
          return;
        }
        const fromRoot = list.findIndex((n) => n.id === id);
        el.dataset.fromRoot = String(fromRoot);
        el.classList.toggle('is-here', id === current.id);
        const shade = depthShade(fromRoot, list.length);
        el.style.setProperty(
          '--mono',
          `color-mix(in srgb, ${current.color} 14%, hsl(0 0% ${Math.round(18 + shade * 42)}%))`,
        );
      });
    });
    applyLayout();
  }

  function bindStage(stage: HTMLElement, kind: StageKind, live: boolean, subtle: boolean) {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.addEventListener('pointerenter', (e) => {
      setExpanded(kind, true);
      if (subtle) paintHint(stage, e as PointerEvent);
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
      if (subtle) paintHint(stage, e);
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
    subtle: boolean,
    live: boolean,
    list: PathNode[],
    current: PathNode,
  ): string {
    const blend = subtle ? blendSubtle : blendColor;
    const monoTop = `color-mix(in srgb, ${current.color} 18%, hsl(0 0% 42%))`;
    const monoLeft = `color-mix(in srgb, ${current.color} 14%, hsl(0 0% 28%))`;
    return `
      <article class="pe-cell ${live ? 'pe-cell-live' : 'pe-cell-rest'}" id="${kind}">
        <p class="pe-cell-label">${label}</p>
        ${live ? '' : `<div class="pe-blend-slot">${blendButtons(blend, subtle ? 'subtle' : 'color')}</div>`}
        <div class="pe-stage ${subtle ? 'is-tint' : 'is-chroma'} ${live ? 'is-live' : ''}"
          data-stage="${kind}" data-live="${live ? '1' : '0'}"
          style="--top-length:${topLength}%;--left-length:${leftLength}%;--blend:${blend};--page:${current.color};--mono-top:${monoTop};--mono-left:${monoLeft}">
          <div class="pe-rails" data-rails>
            <button type="button" class="pe-corner" data-goto="${current.id}" title="${current.label}"
              style="--top-seg:${current.color};--left-seg:${current.color}">
              <span class="pe-corner-miter" aria-hidden="true">
                <span class="pe-miter-top"></span><span class="pe-miter-left"></span>
              </span>
              <span class="pe-corner-color" aria-hidden="true">
                <span class="pe-miter-top"></span><span class="pe-miter-left"></span>
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
        <div class="mode-btns pe-align" role="group" aria-label="Left alignment">
          <span class="variant-switch-name">Left alignment</span>
          <button type="button" class="mode-btn" data-pack="start" title="Top of left edge">
            <span class="align-ico align-ico-start" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
          <button type="button" class="mode-btn" data-pack="end" title="Bottom of left edge">
            <span class="align-ico align-ico-end" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </div>
      </div>
      <p class="pe-caption">
        Rest uses log compression only on hops that would run off. Live uses even shares
        and dock-zooms the focused hop. Subtle stays monochrome until hover reveals color.
      </p>
      <div class="pe-quad">
        <div class="pe-row pe-row-rest">
          ${STAGES.filter((s) => !s.live).map((s) => stageHtml(s.id, s.label, s.subtle, s.live, list, current)).join('')}
        </div>
        <div class="pe-row pe-row-live">
          ${STAGES.filter((s) => s.live).map((s) => stageHtml(s.id, s.label, s.subtle, s.live, list, current)).join('')}
        </div>
      </div>
    `;

    applyPack();
    applyBlends();

    STAGES.forEach((s) => {
      const stage = root.querySelector(`[data-stage="${s.id}"]`) as HTMLElement | null;
      if (stage) {
        if (expanded.has(s.id)) stage.classList.add('is-expanded');
        bindStage(stage, s.id, s.live, s.subtle);
      }
    });

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.goto;
        if (!id || id === currentId) return;
        nameHops();
        markLeaves(id);
        runPathVt(() => applyPath(id));
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

    root.querySelectorAll<HTMLButtonElement>('[data-pack]').forEach((btn) => {
      btn.addEventListener('click', () => {
        leftPack = btn.dataset.pack as Pack;
        applyPack();
      });
    });

    root.querySelectorAll<HTMLElement>('[data-blend-for]').forEach((group) => {
      const which = group.dataset.blendFor === 'subtle' ? 'subtle' : 'color';
      group.addEventListener('pointerleave', () => previewBlend(which, null));
      group.querySelectorAll<HTMLButtonElement>('[data-blend]').forEach((btn) => {
        btn.addEventListener('pointerenter', () => {
          previewBlend(which, btn.dataset.blend as BlendMode);
        });
        btn.addEventListener('click', () => {
          const mode = btn.dataset.blend as BlendMode;
          if (which === 'subtle') blendSubtle = mode;
          else blendColor = mode;
          applyBlends();
        });
      });
    });

    observer = new ResizeObserver(() => applyLayout());
    root.querySelectorAll('.pe-top, .pe-left').forEach((el) => observer!.observe(el));
    applyLayout();
  }

  render();
}
