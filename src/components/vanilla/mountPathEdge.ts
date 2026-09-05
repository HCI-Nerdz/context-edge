import {
  BLEND_MODES,
  bindPathDragScroll,
  demoPath,
  pathSegMono,
  pathStageVars,
  pathThrough,
  scrollPathToCurrent,
  syncPathDepthShadow,
  type BlendMode,
  type PathEdgeAxis,
  type PathNode,
} from '../../lib/path-edge';

type Pack = 'start' | 'end';
type VisualStyle = 'color' | 'subtle';
type StageKind = 'rest' | 'live';

const STAGES: { id: StageKind; live: boolean; label: string }[] = [
  { id: 'rest', live: false, label: 'Rest' },
  { id: 'live', live: true, label: 'Live' },
];

/** Zone size as % of the workshop width (top) or a rem height (side). */
const ZONE_MIN = 42;
const ZONE_MAX = 100;
const ZONE_DEFAULT = 100;

function blendButtons(active: BlendMode): string {
  return `
    <div class="mode-btns" role="group" aria-label="Blend mode" data-blend-for="style">
      ${BLEND_MODES.map(
        (m) => `
        <button type="button" class="mode-btn${m === active ? ' is-on' : ''}" data-blend="${m}">
          ${m}
        </button>`,
      ).join('')}
    </div>`;
}

/** Boot from ?style=&stage= and hashes (#live|#rest|#subtle|#live-subtle). */
function readBootIntent(): { style: VisualStyle; focusStage: StageKind | null; legacy: boolean } {
  const params = new URLSearchParams(location.search);
  const hash = (location.hash || '').replace(/^#/, '').toLowerCase();

  let style: VisualStyle = 'color';
  let focusStage: StageKind | null = null;
  let legacy = false;

  const qStyle = params.get('style');
  if (qStyle === 'subtle' || qStyle === 'color') style = qStyle;
  const qStage = params.get('stage');
  if (qStage === 'live' || qStage === 'rest') focusStage = qStage;

  if (hash === 'live-subtle') {
    legacy = true;
    style = 'subtle';
    focusStage = focusStage ?? 'live';
  } else if (hash === 'subtle') {
    legacy = true;
    style = 'subtle';
  } else if (hash === 'live' || hash === 'rest') {
    focusStage = focusStage ?? hash;
  }

  return { style, focusStage, legacy };
}

function canonicalizeBootUrl(style: VisualStyle, focusStage: StageKind | null) {
  const url = new URL(location.href);
  if (style === 'subtle') url.searchParams.set('style', 'subtle');
  else url.searchParams.delete('style');
  if (focusStage) {
    url.searchParams.set('stage', focusStage);
    url.hash = focusStage;
  } else {
    url.searchParams.delete('stage');
    url.hash = '';
  }
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function mountPathWorkshop(opts: { root: HTMLElement }) {
  const all = demoPath;
  let currentId = all[all.length - 1]!.id;
  let edge: PathEdgeAxis = 'top';
  let leftPack: Pack = 'start';
  const boot = readBootIntent();
  let style: VisualStyle = boot.style;
  let blendColor: BlendMode = 'normal';
  let blendSubtle: BlendMode = 'color';
  let zonePct = ZONE_DEFAULT;
  const expanded = new Set<StageKind>();
  /** Live hover focus — visual only (no hop resize). */
  const focusByStage = new Map<StageKind, number | null>();
  let observer: ResizeObserver | null = null;
  let didBootScroll = false;
  const dragCleanups: Array<() => void> = [];

  if (boot.focusStage) expanded.add(boot.focusStage);
  if (boot.legacy || boot.focusStage || boot.style === 'subtle') {
    canonicalizeBootUrl(boot.style, boot.focusStage);
  }

  const root = opts.root;

  function nodes(): PathNode[] {
    return pathThrough(currentId, all);
  }

  function activeBlend(): BlendMode {
    return style === 'subtle' ? blendSubtle : blendColor;
  }

  function applyZone() {
    root.style.setProperty('--pe-zone-pct', String(zonePct));
    const rows = root.querySelector<HTMLElement>('.pe-rows');
    if (rows) rows.style.setProperty('--pe-zone-pct', String(zonePct));
    const slider = root.querySelector<HTMLInputElement>('[data-zone-size]');
    if (slider) slider.value = String(zonePct);
    const read = root.querySelector('[data-zone-readout]');
    if (read) read.textContent = `${zonePct}%`;
  }

  function syncShadows() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const axis = (stage.dataset.edge === 'left' ? 'left' : 'top') as PathEdgeAxis;
      const rail = stage.querySelector(axis === 'top' ? '.pe-top' : '.pe-left') as HTMLElement | null;
      if (rail) syncPathDepthShadow(rail, axis);
    });
  }

  function revealCurrent() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const axis = (stage.dataset.edge === 'left' ? 'left' : 'top') as PathEdgeAxis;
      const rail = stage.querySelector(axis === 'top' ? '.pe-top' : '.pe-left') as HTMLElement | null;
      const scroller = stage.querySelector('.pe-scroll') as HTMLElement | null;
      if (!rail || !scroller) return;
      scrollPathToCurrent(scroller, axis);
      syncPathDepthShadow(rail, axis);
    });
  }

  function applyFocusClasses() {
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      const id = stage.dataset.stage as StageKind;
      const focus = focusByStage.get(id) ?? null;
      stage.querySelectorAll<HTMLElement>('.pe-seg[data-from-root]').forEach((el) => {
        const fromRoot = Number(el.dataset.fromRoot);
        el.classList.toggle('is-focus', focus != null && fromRoot === focus);
      });
    });
  }

  function applyPack() {
    root.querySelectorAll<HTMLElement>('.pe-left').forEach((left) => {
      left.dataset.pack = leftPack;
      const home = left.querySelector('.pe-home');
      const scroll = left.querySelector('.pe-scroll');
      const slack = left.querySelector('.pe-slack');
      if (!home || !scroll) return;
      if (leftPack === 'start') {
        if (slack) left.append(home, scroll, slack);
        else left.append(home, scroll);
      } else if (slack) left.append(slack, home, scroll);
      else left.append(home, scroll);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-pack]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.dataset.pack === leftPack);
    });
    requestAnimationFrame(() => revealCurrent());
  }

  function applyStyle() {
    const blend = activeBlend();
    root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
      stage.classList.toggle('is-tint', style === 'subtle');
      stage.classList.toggle('is-chroma', style === 'color');
      stage.style.setProperty('--blend', blend);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-style]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.dataset.style === style);
    });
    root.querySelectorAll<HTMLElement>('[data-blend-for]').forEach((group) => {
      group.querySelectorAll<HTMLButtonElement>('[data-blend]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.blend === blend);
      });
    });
  }

  /** Blend preview on the Rest stage only. */
  function previewBlend(mode: BlendMode | null) {
    const stage = root.querySelector('[data-stage="rest"]') as HTMLElement | null;
    if (!stage) return;
    if (mode) {
      stage.style.setProperty('--blend', mode);
      stage.classList.add('is-open', 'is-blend-preview');
    } else {
      stage.style.setProperty('--blend', activeBlend());
      stage.classList.remove('is-blend-preview');
      if (!expanded.has('rest')) stage.classList.remove('is-open');
    }
  }

  function setExpanded(id: StageKind, on: boolean) {
    if (on) expanded.add(id);
    else expanded.delete(id);
    root.querySelector(`[data-stage="${id}"]`)?.classList.toggle('is-open', on);
    if (!on) {
      focusByStage.set(id, null);
      applyFocusClasses();
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
    const rootNode = list[0]!;

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

      const axis = (stage.dataset.edge === 'left' ? 'left' : 'top') as PathEdgeAxis;
      const home = stage.querySelector('.pe-home') as HTMLElement | null;
      if (home) {
        home.classList.toggle('is-here', current.id === rootNode.id);
        home.style.setProperty('--seg', rootNode.color);
        home.style.setProperty('--mono', pathSegMono(current, 0, list.length));
      }

      const track = stage.querySelector('.pe-track') as HTMLElement | null;
      if (!track) return;

      /* Remove hops that left the path; keep home pin outside the track. */
      track.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const id = el.dataset.goto ?? '';
        if (!keep.has(id) || id === rootNode.id) {
          el.remove();
        }
      });

      /* Ensure remaining ancestors + current exist in root→leaf order. */
      const hopNodes = list.slice(1);
      hopNodes.forEach((n, i) => {
        const fromRoot = i + 1;
        let el = track.querySelector<HTMLButtonElement>(`.pe-seg[data-goto="${n.id}"]`);
        if (!el) {
          el = document.createElement('button');
          el.type = 'button';
          el.className = `pe-seg pe-seg-${axis}`;
          el.dataset.goto = n.id;
          el.innerHTML = `
            <span class="pe-seg-color" aria-hidden="true"></span>
            <span class="pe-mark" aria-hidden="true">${n.mark}</span>
            <span class="pe-label">${n.label}</span>`;
          el.addEventListener('click', (ev) => {
            const scroller = el!.closest('.pe-scroll') as HTMLElement | null;
            if (scroller?.dataset.peSuppressClick) {
              ev.preventDefault();
              return;
            }
            const id = el!.dataset.goto;
            if (!id || id === currentId) return;
            nameHops();
            markLeaves(id);
            runPathVt(() => applyPath(id));
          });
          track.append(el);
        }
        el.dataset.fromRoot = String(fromRoot);
        el.title = `${n.label} · ${n.role}`;
        el.classList.toggle('is-here', n.id === current.id);
        el.classList.toggle('is-ancestor', n.id !== current.id);
        el.style.setProperty('--seg', n.color);
        el.style.setProperty('--mono', pathSegMono(current, fromRoot, list.length));
        const mark = el.querySelector('.pe-mark');
        const label = el.querySelector('.pe-label');
        if (mark) mark.textContent = n.mark;
        if (label) label.textContent = n.label;
        track.append(el);
      });
    });

    applyFocusClasses();
    requestAnimationFrame(() => revealCurrent());
  }

  function bindStage(stage: HTMLElement, kind: StageKind, live: boolean) {
    const rails = stage.querySelector('[data-rails]') as HTMLElement;
    rails.addEventListener('pointerenter', (e) => {
      setExpanded(kind, true);
      if (style === 'subtle') paintHint(stage, e as PointerEvent);
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
            applyFocusClasses();
          }
        }
      }
      if (style === 'subtle') paintHint(stage, e);
    });
  }

  function hopHtml(n: PathNode, axis: PathEdgeAxis, page: PathNode, fromRoot: number, count: number): string {
    const here = fromRoot === count - 1;
    const mono = pathSegMono(page, fromRoot, count);
    return `
      <button type="button" class="pe-seg pe-seg-${axis} ${here ? 'is-here' : 'is-ancestor'}"
        data-goto="${n.id}" data-from-root="${fromRoot}"
        style="--seg:${n.color};--mono:${mono}"
        title="${n.label} · ${n.role}">
        <span class="pe-seg-color" aria-hidden="true"></span>
        <span class="pe-mark" aria-hidden="true">${n.mark}</span>
        <span class="pe-label">${n.label}</span>
      </button>`;
  }

  function homeHtml(rootNode: PathNode, page: PathNode, count: number, axis: PathEdgeAxis): string {
    const here = page.id === rootNode.id;
    const mono = pathSegMono(page, 0, count);
    return `
      <button type="button" class="pe-home pe-seg pe-seg-${axis} ${here ? 'is-here' : ''}"
        data-goto="${rootNode.id}" data-from-root="0"
        style="--seg:${rootNode.color};--mono:${mono}"
        title="${rootNode.label} · ${rootNode.role}"
        aria-label="${rootNode.label}">
        <span class="pe-seg-color" aria-hidden="true"></span>
        <span class="pe-home-ico" aria-hidden="true">${rootNode.mark}</span>
      </button>`;
  }

  function railHtml(label: string, list: PathNode[], current: PathNode): string {
    const rootNode = list[0]!;
    const hops = list.slice(1);
    const trackHops = hops.map((n) => hopHtml(n, edge, current, list.indexOf(n), list.length)).join('');
    const home = homeHtml(rootNode, current, list.length, edge);

    if (edge === 'top') {
      return `
        <div class="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="${label} top path">
          ${home}
          <div class="pe-scroll pe-scroll-top" tabindex="0" aria-label="Path hops">
            <div class="pe-track pe-track-top">
              <div class="pe-depth-shadow" aria-hidden="true"></div>
              ${trackHops}
            </div>
          </div>
        </div>`;
    }
    return `
      <div class="pe-left cr-rail cr-rail-left" data-pack="${leftPack}" role="toolbar" aria-label="${label} side path">
        ${home}
        <div class="pe-scroll pe-scroll-left" tabindex="0" aria-label="Path hops">
          <div class="pe-track pe-track-left">
            <div class="pe-depth-shadow" aria-hidden="true"></div>
            ${trackHops}
          </div>
        </div>
        <div class="pe-slack" aria-hidden="true"></div>
      </div>`;
  }

  function stageHtml(
    kind: StageKind,
    label: string,
    live: boolean,
    list: PathNode[],
    current: PathNode,
  ): string {
    const blend = activeBlend();
    const vars = pathStageVars(current);
    const subtle = style === 'subtle';
    return `
      <article class="pe-cell ${live ? 'pe-cell-live' : 'pe-cell-rest'}" id="${kind}">
        <p class="pe-cell-label">${label}</p>
        ${live ? '' : `<div class="pe-blend-slot">${blendButtons(blend)}</div>`}
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

  function clearDragBindings() {
    while (dragCleanups.length) dragCleanups.pop()?.();
  }

  function bindScrollers() {
    clearDragBindings();
    root.querySelectorAll<HTMLElement>('.pe-scroll').forEach((scroller) => {
      const axis = scroller.classList.contains('pe-scroll-left') ? 'left' : 'top';
      dragCleanups.push(bindPathDragScroll(scroller, axis));

      scroller.addEventListener('scroll', () => {
        const rail = scroller.closest('.pe-top, .pe-left') as HTMLElement | null;
        if (rail) syncPathDepthShadow(rail, axis);
      });

      scroller.addEventListener('keydown', (e) => {
        const step = 48;
        if (axis === 'top') {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scroller.scrollLeft -= step;
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scroller.scrollLeft += step;
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          scroller.scrollTop -= step;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          scroller.scrollTop += step;
        }
      });
    });
  }

  function render() {
    observer?.disconnect();
    clearDragBindings();
    const list = nodes();
    const current = list[list.length - 1]!;
    root.innerHTML = `
      <div class="cr-toolbar pe-toolbar">
        <div class="mode-btns" role="group" aria-label="Edge placement">
          <span class="variant-switch-name">Edge</span>
          <button type="button" class="mode-btn${edge === 'top' ? ' is-on' : ''}" data-edge="top">Top</button>
          <button type="button" class="mode-btn${edge === 'left' ? ' is-on' : ''}" data-edge="left">Side</button>
        </div>
        <div class="mode-btns" role="group" aria-label="Visual style">
          <span class="variant-switch-name">Style</span>
          <button type="button" class="mode-btn${style === 'color' ? ' is-on' : ''}" data-style="color">Color</button>
          <button type="button" class="mode-btn${style === 'subtle' ? ' is-on' : ''}" data-style="subtle">Subtle</button>
        </div>
        <div class="mode-btns pe-align" role="group" aria-label="Side alignment" ${edge === 'left' ? '' : 'hidden'}>
          <span class="variant-switch-name">Alignment</span>
          <button type="button" class="mode-btn" data-pack="start" title="Pack hops toward the start of the rail">
            <span class="align-ico align-ico-start" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
          <button type="button" class="mode-btn" data-pack="end" title="Pack hops toward the end of the rail">
            <span class="align-ico align-ico-end" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </div>
        <div class="mode-btns pe-zone" role="group" aria-label="Demo zone size">
          <span class="variant-switch-name">Zone</span>
          <input type="range" min="${ZONE_MIN}" max="${ZONE_MAX}" value="${zonePct}"
            data-zone-size aria-valuetext="${zonePct} percent" />
          <span class="pe-zone-readout" data-zone-readout>${zonePct}%</span>
        </div>
      </div>
      <p class="pe-caption">
        Top or Side — one full-length edge with a rail foundation behind every hop.
        Home stays pinned; overflow hops hide under Home — drag, swipe, or arrow-key the rail to scroll.
        Shrink the zone to force overflow; expand it to see hops fit. Side alignment packs the hop group
        inside the full rail — the foundation still spans the whole edge.
      </p>
      <div class="pe-rows" data-edge="${edge}">
        ${STAGES.map((s) => `
          <div class="pe-row pe-row-${s.id}">
            ${stageHtml(s.id, s.label, s.live, list, current)}
          </div>`).join('')}
      </div>
    `;

    applyZone();
    applyPack();
    applyStyle();
    bindScrollers();

    STAGES.forEach((s) => {
      const stage = root.querySelector(`[data-stage="${s.id}"]`) as HTMLElement | null;
      if (stage) {
        if (expanded.has(s.id)) stage.classList.add('is-open');
        bindStage(stage, s.id, s.live);
      }
    });

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        const scroller = (el as HTMLElement).closest('.pe-scroll') as HTMLElement | null;
        if (scroller?.dataset.peSuppressClick) {
          ev.preventDefault();
          return;
        }
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

    root.querySelectorAll<HTMLButtonElement>('[data-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.style as VisualStyle;
        if (next === style) return;
        style = next;
        applyStyle();
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-pack]').forEach((btn) => {
      btn.addEventListener('click', () => {
        leftPack = btn.dataset.pack as Pack;
        applyPack();
      });
    });

    const zoneInput = root.querySelector<HTMLInputElement>('[data-zone-size]');
    zoneInput?.addEventListener('input', () => {
      zonePct = Number(zoneInput.value);
      applyZone();
      requestAnimationFrame(() => revealCurrent());
    });

    root.querySelectorAll<HTMLElement>('[data-blend-for]').forEach((group) => {
      group.addEventListener('pointerleave', () => previewBlend(null));
      group.querySelectorAll<HTMLButtonElement>('[data-blend]').forEach((btn) => {
        btn.addEventListener('pointerenter', () => {
          previewBlend(btn.dataset.blend as BlendMode);
        });
        btn.addEventListener('click', () => {
          const mode = btn.dataset.blend as BlendMode;
          if (style === 'subtle') blendSubtle = mode;
          else blendColor = mode;
          applyStyle();
        });
      });
    });

    observer = new ResizeObserver(() => {
      requestAnimationFrame(() => syncShadows());
    });
    root.querySelectorAll('.pe-top, .pe-left').forEach((el) => observer!.observe(el));
    requestAnimationFrame(() => revealCurrent());

    if (!didBootScroll && boot.focusStage) {
      didBootScroll = true;
      const cell = root.querySelector(`#${boot.focusStage}`);
      requestAnimationFrame(() => {
        cell?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }

  render();
}
