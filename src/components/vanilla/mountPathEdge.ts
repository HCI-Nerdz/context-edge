import {
  BLEND_MODES,
  demoPath,
  pathSegMono,
  pathStageVars,
  pathThrough,
  sizePathStacks,
  type BlendMode,
  type PathEdgeAxis,
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
  let edge: PathEdgeAxis = 'top';
  let leftPack: Pack = 'start';
  let blendColor: BlendMode = 'normal';
  let blendSubtle: BlendMode = 'color';
  const expanded = new Set<StageKind>();
  /** Live dock-zoom focus — one value per stage so Live ≠ Live Subtle. */
  const focusByStage = new Map<StageKind, number | null>();
  let observer: ResizeObserver | null = null;

  const root = opts.root;

  function nodes(): PathNode[] {
    return pathThrough(currentId, all);
  }

  function applyLayout() {
    const list = nodes();
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const id = stage.dataset.stage as StageKind;
      sizePathStacks({
        stage,
        count: list.length,
        live: stage.dataset.live === '1',
        focusFromRoot: focusByStage.get(id) ?? null,
        edge,
      });
    });
  }

  function applyPack() {
    root.querySelectorAll<HTMLElement>('.pe-left').forEach((left) => {
      left.dataset.pack = leftPack;
      const stack = left.querySelector('.pe-stack-left');
      const slack = left.querySelector('.pe-slack');
      if (!stack) return;
      if (leftPack === 'start') {
        if (slack) left.append(stack, slack);
        else left.append(stack);
      } else if (slack) left.append(slack, stack);
      else left.append(stack);
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

  /** Blend preview only on the Rest cell — never opens Live / Live Subtle. */
  function previewBlend(which: 'color' | 'subtle', mode: BlendMode | null) {
    const id: StageKind = which === 'subtle' ? 'subtle' : 'color';
    const stage = root.querySelector(`[data-stage="${id}"]`) as HTMLElement | null;
    if (!stage) return;
    if (mode) {
      stage.style.setProperty('--blend', mode);
      stage.classList.add('is-open', 'is-blend-preview');
    } else {
      stage.style.setProperty('--blend', which === 'subtle' ? blendSubtle : blendColor);
      stage.classList.remove('is-blend-preview');
      if (!expanded.has(id)) stage.classList.remove('is-open');
    }
  }

  function setExpanded(id: StageKind, on: boolean) {
    if (on) expanded.add(id);
    else expanded.delete(id);
    root.querySelector(`[data-stage="${id}"]`)?.classList.toggle('is-open', on);
    if (!on) {
      focusByStage.set(id, null);
      applyLayout();
    }
  }

  function paintHint(stage: HTMLElement, e: PointerEvent) {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
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
      el.style.viewTransitionClass = leaf ? `pe-leaf pe-leaf-${axis}` : 'pe-keep';
    });
  }

  function applyPath(nextId: string) {
    currentId = nextId;
    const list = nodes();
    const current = list[list.length - 1]!;
    const keep = new Set(list.map((n) => n.id));
    const vars = pathStageVars(current);

    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      stage.style.setProperty('--page', vars.page);
      stage.style.setProperty('--mono-top', vars.monoTop);
      stage.style.setProperty('--mono-left', vars.monoLeft);
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
        el.style.setProperty('--mono', pathSegMono(current, fromRoot, list.length));
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
    });
    rails.addEventListener('pointermove', (e) => {
      if (live) {
        const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
        if (t) {
          const next = Number(t.dataset.fromRoot);
          if (next !== focusByStage.get(kind)) {
            focusByStage.set(kind, next);
            applyLayout();
          }
        }
      }
      if (subtle) paintHint(stage, e);
    });
  }

  function segs(list: PathNode[], axis: PathEdgeAxis, page: PathNode): string {
    return [...list]
      .reverse()
      .map((n) => {
        const fromRoot = list.indexOf(n);
        const here = fromRoot === list.length - 1;
        const mono = pathSegMono(page, fromRoot, list.length);
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

  function railHtml(label: string, list: PathNode[], current: PathNode): string {
    if (edge === 'top') {
      return `
        <div class="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="${label} top path">
          <div class="pe-stack pe-stack-top">${segs(list, 'top', current)}</div>
        </div>`;
    }
    return `
      <div class="pe-left cr-rail cr-rail-left" data-pack="${leftPack}" role="toolbar" aria-label="${label} side path">
        <div class="pe-stack pe-stack-left">${segs(list, 'left', current)}</div>
        <div class="pe-slack" aria-hidden="true"></div>
      </div>`;
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
    const vars = pathStageVars(current);
    return `
      <article class="pe-cell ${live ? 'pe-cell-live' : 'pe-cell-rest'}" id="${kind}">
        <p class="pe-cell-label">${label}</p>
        ${live ? '' : `<div class="pe-blend-slot">${blendButtons(blend, subtle ? 'subtle' : 'color')}</div>`}
        <div class="pe-stage ${subtle ? 'is-tint' : 'is-chroma'} ${live ? 'is-live' : ''}"
          data-stage="${kind}" data-edge="${edge}" data-live="${live ? '1' : '0'}"
          style="--blend:${blend};--page:${vars.page};--mono-top:${vars.monoTop};--mono-left:${vars.monoLeft}">
          <div class="pe-rails" data-rails>
            ${railHtml(label, list, current)}
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
        <div class="mode-btns" role="group" aria-label="Edge placement">
          <span class="variant-switch-name">Edge</span>
          <button type="button" class="mode-btn${edge === 'top' ? ' is-on' : ''}" data-edge="top">Top</button>
          <button type="button" class="mode-btn${edge === 'left' ? ' is-on' : ''}" data-edge="left">Side</button>
        </div>
        <div class="mode-btns pe-align" role="group" aria-label="Side alignment" ${edge === 'left' ? '' : 'hidden'}>
          <span class="variant-switch-name">Alignment</span>
          <button type="button" class="mode-btn" data-pack="start" title="Top of side edge">
            <span class="align-ico align-ico-start" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
          <button type="button" class="mode-btn" data-pack="end" title="Bottom of side edge">
            <span class="align-ico align-ico-end" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </div>
      </div>
      <p class="pe-caption">
        Choose Top or Side — one edge only, full length. Rest compresses overflow hops;
        Live uses even shares and dock-zooms the focused hop. Subtle stays monochrome until
        hover reveals color. Each cell keeps its own hover response.
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
        if (expanded.has(s.id)) stage.classList.add('is-open');
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

    root.querySelectorAll<HTMLButtonElement>('[data-edge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.edge as PathEdgeAxis;
        if (next === edge) return;
        edge = next;
        focusByStage.clear();
        expanded.clear();
        render();
      });
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
