import { demoPath, pathThrough, type PathNode } from '../../lib/path-edge';

export type PathEdgeOptions = {
  root: HTMLElement;
  nodes?: PathNode[];
  initialId?: string;
};

/**
 * Variant C — Path Edge.
 * Idle rails show the breadcrumb as a color series.
 * Hovering either edge expands both (same nav type).
 * Top: horizontal labels. Left: current-at-top, one mark per level, no rotated text.
 * Deep ancestors compress; expand + scroll unfolds them.
 */
export function mountPathEdge(opts: PathEdgeOptions) {
  const all = opts.nodes ?? demoPath;
  let currentId = opts.initialId ?? all[all.length - 1]!.id;
  let expanded = false;
  /** 0–100: how far toward the top ancestors may climb before compressing */
  let ceiling = 72;
  const root = opts.root;

  function path(): PathNode[] {
    return pathThrough(currentId, all);
  }

  function setExpanded(on: boolean) {
    expanded = on;
    root.querySelector('.pe-stage')?.classList.toggle('is-expanded', on);
    const status = root.querySelector('[data-pe-status]');
    const nodes = path();
    if (status) {
      status.textContent = `Path Edge · ${on ? 'expanded' : 'idle'} · ${nodes.map((n) => n.label).join(' / ')}`;
    }
  }

  function bindExpand(el: HTMLElement) {
    el.addEventListener('pointerenter', () => setExpanded(true));
    el.addEventListener('pointerleave', () => setExpanded(false));
    el.addEventListener('focusin', () => setExpanded(true));
    el.addEventListener('focusout', (e) => {
      if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
      setExpanded(false);
    });
  }

  function render() {
    const nodes = path();
    const current = nodes[nodes.length - 1]!;
    const display = [...nodes].reverse(); // current first (top / start)

    root.innerHTML = `
      <div class="cr-toolbar pe-toolbar">
        <label>
          Compress ceiling
          <input type="range" min="40" max="95" value="${ceiling}" data-ceiling />
          <span>${ceiling}%</span>
        </label>
        <span data-pe-status>
          Path Edge · idle · ${nodes.map((n) => n.label).join(' / ')}
        </span>
      </div>
      <div class="pe-stage ${expanded ? 'is-expanded' : ''}" style="--ceiling:${ceiling}%">
        <div class="pe-rails" data-rails>
          <button
            type="button"
            class="pe-corner"
            data-goto="${current.id}"
            title="${current.label}"
            aria-label="Corner · ${current.label}"
            style="--top-seg:${display[0]!.color};--left-seg:${display[0]!.color}"
          >
            <span class="pe-corner-top" aria-hidden="true"></span>
            <span class="pe-corner-left" aria-hidden="true"></span>
          </button>
          <div class="pe-top" role="toolbar" aria-label="Path labels (top edge)">
            ${display
              .map(
                (n) => `
              <button type="button" class="pe-seg pe-seg-top" data-goto="${n.id}"
                style="--seg:${n.color}" title="${n.label}">
                <span class="pe-label">${n.label}</span>
              </button>`,
              )
              .join('')}
          </div>
          <div class="pe-left" role="toolbar" aria-label="Path marks (left edge)">
            <div class="pe-left-scroll">
              ${display
                .map(
                  (n, i) => `
                <button type="button" class="pe-seg pe-seg-left ${i === 0 ? 'is-here' : 'is-ancestor'}"
                  data-goto="${n.id}" style="--seg:${n.color}" title="${n.label} · ${n.role}">
                  <span class="pe-mark" aria-hidden="true">${n.mark}</span>
                </button>`,
                )
                .join('')}
            </div>
          </div>
        </div>
        <div class="cr-content pe-content">
          <h2>${current.label}</h2>
          <p class="meta">${current.role} · path length ${nodes.length}</p>
          <p>${current.blurb}</p>
          <p>
            Hover either edge — both expand. Labels stay on the <em>top</em> (readable).
            The left edge keeps one mark per level, current at the top-left. Deeper
            ancestors compress toward the bottom; scroll the left rail to unfold them.
          </p>
        </div>
      </div>
    `;

    const rails = root.querySelector('[data-rails]') as HTMLElement;
    bindExpand(rails);

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.goto;
        if (id) {
          currentId = id;
          const stayOpen = expanded;
          render();
          if (stayOpen) setExpanded(true);
        }
      });
    });

    const range = root.querySelector('[data-ceiling]') as HTMLInputElement | null;
    const stage = root.querySelector('.pe-stage') as HTMLElement | null;
    const label = range?.parentElement?.querySelector('span');
    range?.addEventListener('input', () => {
      ceiling = Number(range.value);
      stage?.style.setProperty('--ceiling', `${ceiling}%`);
      if (label) label.textContent = `${ceiling}%`;
    });
  }

  render();
}
