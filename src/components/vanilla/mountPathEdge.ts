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

  function bindExpand(el: HTMLElement) {
    const on = () => {
      expanded = true;
      render();
    };
    const off = () => {
      expanded = false;
      render();
    };
    el.addEventListener('mouseenter', on);
    el.addEventListener('mouseleave', (e) => {
      const next = e.relatedTarget as Node | null;
      if (next && el.contains(next)) return;
      off();
    });
    el.addEventListener('focusin', on);
    el.addEventListener('focusout', (e) => {
      if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
      off();
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
        <span>
          Path Edge · ${expanded ? 'expanded' : 'idle'} · ${nodes.map((n) => n.label).join(' / ')}
        </span>
      </div>
      <div class="pe-stage ${expanded ? 'is-expanded' : ''}" style="--ceiling:${ceiling}%">
        <div class="pe-rails" data-rails>
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
          render();
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
