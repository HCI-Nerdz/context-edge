import {
  BLEND_MODES,
  bindMobileEdgeSwipe,
  bindPathDragScroll,
  bindTopPullReveal,
  demoPath,
  HOME_ICON_SVG,
  pathSegInk,
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
  { id: 'rest', live: false, label: 'Still' },
  { id: 'live', live: true, label: 'Live' },
];

const DEFAULT_PATH_ID = demoPath[demoPath.length - 1]!.id;

/** Demo stage size bounds (px) for edge drag-resize. */
const ZONE_MIN_W = 260;
const ZONE_MIN_H = 200;

/** Lucide panel-top / panel-left (ISC) — currentColor. */
const EDGE_TOP_ICO = `<svg class="pe-ctrl-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>`;
const EDGE_SIDE_ICO = `<svg class="pe-ctrl-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`;

function blendSelect(active: BlendMode): string {
  return `
    <label class="pe-blend-label">
      <span class="variant-switch-name">Blend math</span>
      <select class="pe-blend-select" data-blend-select aria-label="Blend math">
        ${BLEND_MODES.map(
          (m) => `<option value="${m}"${m === active ? ' selected' : ''}>${m}</option>`,
        ).join('')}
      </select>
    </label>`;
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
  let currentId = DEFAULT_PATH_ID;
  let edge: PathEdgeAxis = 'top';
  let leftPack: Pack = 'start';
  const boot = readBootIntent();
  let style: VisualStyle = boot.style;
  let blendColor: BlendMode = 'normal';
  let blendSubtle: BlendMode = 'color';
  /** Synced stage width (top) / height (side); null = natural full size. */
  let zoneWidthPx: number | null = null;
  let zoneHeightPx: number | null = null;
  const expanded = new Set<StageKind>();
  /** Sticky open from mobile edge-swipe (survives pointerleave). */
  const stickyOpen = new Set<StageKind>();
  /** Live hover focus — visual only (no hop resize). */
  const focusByStage = new Map<StageKind, number | null>();
  let observer: ResizeObserver | null = null;
  let didBootScroll = false;
  const dragCleanups: Array<() => void> = [];
  const gestureCleanups: Array<() => void> = [];
  const resizeCleanups: Array<() => void> = [];

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

  function segInk(n: PathNode, fromRoot: number, page: PathNode, count: number): string {
    return pathSegInk(n.color, { style, fromRoot, count, page });
  }

  function applyZone() {
    const rows = root.querySelector<HTMLElement>('.pe-rows');
    if (!rows) return;
    if (edge === 'top') {
      rows.style.removeProperty('--pe-zone-height');
      if (zoneWidthPx != null) rows.style.setProperty('--pe-zone-width', `${zoneWidthPx}px`);
      else rows.style.removeProperty('--pe-zone-width');
    } else {
      rows.style.removeProperty('--pe-zone-width');
      if (zoneHeightPx != null) rows.style.setProperty('--pe-zone-height', `${zoneHeightPx}px`);
      else rows.style.removeProperty('--pe-zone-height');
    }
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
      const shadow = left.querySelector('.pe-depth-shadow');
      if (!home || !scroll) return;
      if (leftPack === 'start') {
        if (slack) left.append(home, scroll, slack);
        else left.append(home, scroll);
      } else if (slack) {
        left.append(slack, home, scroll);
      } else {
        left.append(home, scroll);
      }
      /* Absolute overlay — keep after home for paint order under the pin. */
      if (shadow) left.insertBefore(shadow, scroll);
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
    const sel = root.querySelector<HTMLSelectElement>('[data-blend-select]');
    if (sel) sel.value = blend;
    /* Refresh per-tile ink when style flips. */
    const list = nodes();
    const page = list[list.length - 1]!;
    root.querySelectorAll<HTMLElement>('.pe-seg[data-goto]').forEach((el) => {
      const id = el.dataset.goto ?? '';
      const n = list.find((x) => x.id === id);
      if (!n) return;
      const fromRoot = Number(el.dataset.fromRoot);
      el.style.setProperty('--tile-ink', segInk(n, fromRoot, page, list.length));
    });
  }

  function previewBlend(mode: BlendMode | null) {
    const stage = root.querySelector('[data-stage="rest"]') as HTMLElement | null;
    if (!stage) return;
    if (mode) {
      stage.style.setProperty('--blend', mode);
      stage.classList.add('is-open', 'is-blend-preview');
    } else {
      stage.style.setProperty('--blend', activeBlend());
      stage.classList.remove('is-blend-preview');
      if (!expanded.has('rest') && !stickyOpen.has('rest')) stage.classList.remove('is-open');
    }
  }

  function setExpanded(id: StageKind, on: boolean) {
    if (on) expanded.add(id);
    else expanded.delete(id);
    const open = on || stickyOpen.has(id);
    root.querySelector(`[data-stage="${id}"]`)?.classList.toggle('is-open', open);
    if (!on && !stickyOpen.has(id)) {
      focusByStage.set(id, null);
      applyFocusClasses();
    }
  }

  function setStickyOpen(id: StageKind, on: boolean) {
    if (on) stickyOpen.add(id);
    else stickyOpen.delete(id);
    root.querySelector(`[data-stage="${id}"]`)?.classList.toggle('is-open', on || expanded.has(id));
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

  function hopInnerHtml(n: PathNode): string {
    return `
      <span class="pe-seg-color" aria-hidden="true"></span>
      <span class="pe-chevron" aria-hidden="true"></span>
      <span class="pe-mark" aria-hidden="true">${n.mark}</span>
      <span class="pe-label">${n.label}</span>`;
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
        home.style.setProperty('--tile-ink', segInk(rootNode, 0, current, list.length));
      }

      const track = stage.querySelector('.pe-track') as HTMLElement | null;
      if (!track) return;

      track.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const id = el.dataset.goto ?? '';
        if (!keep.has(id) || id === rootNode.id) {
          el.remove();
        }
      });

      const hopNodes = list.slice(1);
      hopNodes.forEach((n, i) => {
        const fromRoot = i + 1;
        let el = track.querySelector<HTMLButtonElement>(`.pe-seg[data-goto="${n.id}"]`);
        if (!el) {
          el = document.createElement('button');
          el.type = 'button';
          el.className = `pe-seg pe-seg-${axis} pe-arrow`;
          el.dataset.goto = n.id;
          el.innerHTML = hopInnerHtml(n);
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
        el.style.setProperty('--tile-ink', segInk(n, fromRoot, current, list.length));
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

    /* Mobile: left-edge swipe toggles sticky open (top pull-to-reveal stubbed). */
    gestureCleanups.push(
      bindMobileEdgeSwipe(stage, {
        isOpen: () => stickyOpen.has(kind) || expanded.has(kind),
        onToggle: (open) => setStickyOpen(kind, open),
      }),
    );
    gestureCleanups.push(
      bindTopPullReveal(stage, {
        onReveal: () => setStickyOpen(kind, true),
        onDismiss: () => setStickyOpen(kind, false),
      }),
    );
  }

  function bindStageResize(handle: HTMLElement, mode: 'width' | 'height') {
    let active = false;
    let pointerId = -1;
    let startClient = 0;
    let startSize = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const stage = handle.closest('.pe-stage') as HTMLElement | null;
      if (!stage) return;
      active = true;
      pointerId = e.pointerId;
      startClient = mode === 'width' ? e.clientX : e.clientY;
      startSize = mode === 'width' ? stage.offsetWidth : stage.offsetHeight;
      handle.classList.add('is-dragging');
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== pointerId) return;
      const delta = (mode === 'width' ? e.clientX : e.clientY) - startClient;
      const rows = root.querySelector('.pe-rows') as HTMLElement | null;
      const maxW = rows?.clientWidth ?? 1200;
      if (mode === 'width') {
        zoneWidthPx = Math.min(maxW, Math.max(ZONE_MIN_W, Math.round(startSize + delta)));
      } else {
        zoneHeightPx = Math.max(ZONE_MIN_H, Math.round(startSize + delta));
      }
      applyZone();
      requestAnimationFrame(() => revealCurrent());
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      active = false;
      pointerId = -1;
      handle.classList.remove('is-dragging');
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);

    resizeCleanups.push(() => {
      handle.removeEventListener('pointerdown', onDown);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    });
  }

  function hopHtml(n: PathNode, axis: PathEdgeAxis, page: PathNode, fromRoot: number, count: number): string {
    const here = fromRoot === count - 1;
    const mono = pathSegMono(page, fromRoot, count);
    const ink = segInk(n, fromRoot, page, count);
    return `
      <button type="button" class="pe-seg pe-seg-${axis} pe-arrow ${here ? 'is-here' : 'is-ancestor'}"
        data-goto="${n.id}" data-from-root="${fromRoot}"
        style="--seg:${n.color};--mono:${mono};--tile-ink:${ink}"
        title="${n.label} · ${n.role}">
        ${hopInnerHtml(n)}
      </button>`;
  }

  function homeHtml(rootNode: PathNode, page: PathNode, count: number, axis: PathEdgeAxis): string {
    const here = page.id === rootNode.id;
    const mono = pathSegMono(page, 0, count);
    const ink = segInk(rootNode, 0, page, count);
    return `
      <button type="button" class="pe-home pe-seg pe-seg-${axis} pe-arrow pe-arrow-home ${here ? 'is-here' : ''}"
        data-goto="${rootNode.id}" data-from-root="0"
        style="--seg:${rootNode.color};--mono:${mono};--tile-ink:${ink}"
        title="${rootNode.label} · ${rootNode.role}"
        aria-label="${rootNode.label}">
        <span class="pe-seg-color" aria-hidden="true"></span>
        <span class="pe-chevron" aria-hidden="true"></span>
        <span class="pe-home-ico" aria-hidden="true">${HOME_ICON_SVG}</span>
      </button>`;
  }

  function railHtml(label: string, list: PathNode[], current: PathNode): string {
    const rootNode = list[0]!;
    const hops = list.slice(1);
    const trackHops = hops.map((n) => hopHtml(n, edge, current, list.indexOf(n), list.length)).join('');
    const home = homeHtml(rootNode, current, list.length, edge);
    /* Depth shadow is a rail overlay (not inside the scrolling track). */
    const depth = `<div class="pe-depth-shadow" aria-hidden="true"></div>`;

    if (edge === 'top') {
      return `
        <div class="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="${label} top path">
          ${home}
          ${depth}
          <div class="pe-scroll pe-scroll-top" tabindex="0" aria-label="Path hops">
            <div class="pe-track pe-track-top">
              ${trackHops}
            </div>
          </div>
        </div>`;
    }
    return `
      <div class="pe-left cr-rail cr-rail-left" data-pack="${leftPack}" role="toolbar" aria-label="${label} side path">
        ${home}
        ${depth}
        <div class="pe-scroll pe-scroll-left" tabindex="0" aria-label="Path hops">
          <div class="pe-track pe-track-left">
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
    const resizeMode = edge === 'top' ? 'width' : 'height';
    const resizeClass = edge === 'top' ? 'pe-resize-e' : 'pe-resize-s';
    const resizeLabel = edge === 'top' ? 'Resize stage width' : 'Resize stage height';
    return `
      <article class="pe-cell ${live ? 'pe-cell-live' : 'pe-cell-rest'}" id="${kind}">
        ${live ? '' : `<div class="pe-blend-slot">${blendSelect(blend)}</div>`}
        <p class="pe-cell-label">${label}</p>
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
          <div class="pe-resize ${resizeClass}" data-resize="${resizeMode}"
            role="separator" tabindex="0" aria-orientation="${edge === 'top' ? 'vertical' : 'horizontal'}"
            aria-label="${resizeLabel}" title="${resizeLabel}"></div>
        </div>
      </article>`;
  }

  function clearDragBindings() {
    while (dragCleanups.length) dragCleanups.pop()?.();
  }

  function clearGestureBindings() {
    while (gestureCleanups.length) gestureCleanups.pop()?.();
  }

  function clearResizeBindings() {
    while (resizeCleanups.length) resizeCleanups.pop()?.();
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
    clearGestureBindings();
    clearResizeBindings();
    const list = nodes();
    const current = list[list.length - 1]!;
    root.innerHTML = `
      <p class="pe-caption">
        Top or Side — one full-length edge with a rail foundation behind every hop.
        Home stays pinned; overflow hops hide under Home — drag, swipe, or arrow-key the rail to scroll.
        On touch, swipe inward from the left stage edge to open or dismiss the bar
        (pull-down reveal is stubbed until browsers stop owning that gesture for refresh).
        Drag the stage’s free edge to resize (Still and Live stay synced). Side alignment packs hops inside the full rail.
        A zoomable facsimile-canvas shell is future work — this demo runs the real rail code.
      </p>
      <div class="cr-toolbar pe-toolbar">
        <div class="mode-btns" role="group" aria-label="Edge placement">
          <span class="variant-switch-name">Edge</span>
          <button type="button" class="mode-btn pe-ico-btn${edge === 'top' ? ' is-on' : ''}" data-edge="top" title="Top edge" aria-label="Top edge">
            ${EDGE_TOP_ICO}
          </button>
          <button type="button" class="mode-btn pe-ico-btn${edge === 'left' ? ' is-on' : ''}" data-edge="left" title="Side edge" aria-label="Side edge">
            ${EDGE_SIDE_ICO}
          </button>
        </div>
        <div class="mode-btns" role="group" aria-label="Visual style">
          <span class="variant-switch-name">Style</span>
          <button type="button" class="mode-btn pe-style-btn${style === 'color' ? ' is-on' : ''}" data-style="color" title="Color" aria-label="Color style">
            <span class="pe-style-swatch pe-style-swatch-color" aria-hidden="true"></span>
          </button>
          <button type="button" class="mode-btn pe-style-btn${style === 'subtle' ? ' is-on' : ''}" data-style="subtle" title="Subtle" aria-label="Subtle style">
            <span class="pe-style-swatch pe-style-swatch-subtle" aria-hidden="true"></span>
          </button>
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
        <button type="button" class="mode-btn pe-reset" data-reset title="Reset path to the demo leaf">
          Reset path
        </button>
      </div>
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
        if (expanded.has(s.id) || stickyOpen.has(s.id)) stage.classList.add('is-open');
        bindStage(stage, s.id, s.live);
      }
    });

    root.querySelectorAll<HTMLElement>('[data-resize]').forEach((handle) => {
      const mode = handle.dataset.resize === 'height' ? 'height' : 'width';
      bindStageResize(handle, mode);
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
        stickyOpen.clear();
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

    root.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => {
      if (currentId === DEFAULT_PATH_ID) {
        revealCurrent();
        return;
      }
      nameHops();
      markLeaves(DEFAULT_PATH_ID);
      runPathVt(() => applyPath(DEFAULT_PATH_ID));
    });

    const blendSel = root.querySelector<HTMLSelectElement>('[data-blend-select]');
    blendSel?.addEventListener('change', () => {
      const mode = blendSel.value as BlendMode;
      if (style === 'subtle') blendSubtle = mode;
      else blendColor = mode;
      applyStyle();
    });
    blendSel?.addEventListener('focus', () => previewBlend(blendSel.value as BlendMode));
    blendSel?.addEventListener('blur', () => previewBlend(null));

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
