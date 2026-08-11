import { demoAncestry, stackThrough, type NavNode } from '../../lib/nav-stack';

export type ModalEdgeOptions = {
  root: HTMLElement;
  nodes?: NavNode[];
  initialId?: string;
};

/**
 * Modal Edge / Nav Edge variant B:
 * Edge color = current node. Click slides the current sheet down+right
 * (View Transitions when available) to reveal ancestor layers behind it.
 */
export function mountModalEdge(opts: ModalEdgeOptions) {
  const nodes = opts.nodes ?? demoAncestry;
  let currentId = opts.initialId ?? nodes[nodes.length - 1]!.id;
  let revealed = false;
  const root = opts.root;

  function stack(): NavNode[] {
    return stackThrough(currentId, nodes);
  }

  function runTransition(update: () => void) {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(update);
    } else {
      update();
    }
  }

  function render() {
    const path = stack();
    const current = path[path.length - 1]!;
    const ancestors = path.slice(0, -1);

    root.innerHTML = `
      <div class="cr-toolbar">
        <span>
          Modal Edge · View Transitions stack ·
          ${revealed ? 'layers revealed' : 'sheet closed'} · ${current.label}
        </span>
        <button type="button" class="me-hint-btn" data-toggle>
          ${revealed ? 'Close stack' : 'Open Nav Edge'}
        </button>
      </div>
      <div
        class="me-viewport ${revealed ? 'is-revealed' : ''}"
        style="--overlay:${current.overlay};--overlay-2:${current.overlay2}"
      >
        <div class="me-stack" aria-hidden="${revealed ? 'false' : 'true'}">
          ${ancestors
            .map(
              (n, i) => `
            <button
              type="button"
              class="me-layer"
              data-goto="${n.id}"
              style="--layer-overlay:${n.overlay};--layer-overlay-2:${n.overlay2};--depth:${i}"
            >
              <span class="me-layer-edge" aria-hidden="true"></span>
              <span class="me-layer-body">
                <strong>${n.label}</strong>
                <small>${n.role}</small>
              </span>
            </button>
          `,
            )
            .join('')}
        </div>

        <div class="me-sheet" style="view-transition-name: me-sheet">
          <button
            type="button"
            class="cr-rail cr-rail-top me-edge"
            data-toggle
            aria-label="Reveal navigation stack from top edge"
            style="--overlay:${current.overlay}"
          >
            <span class="cr-rail-label">${current.label}</span>
          </button>
          <button
            type="button"
            class="cr-rail cr-rail-left me-edge"
            data-toggle
            aria-label="Reveal navigation stack from left edge"
            style="--overlay:${current.overlay}"
          >
            <span class="cr-rail-label">${current.role}</span>
          </button>
          <div class="cr-content me-content">
            <h2>${current.label}</h2>
            <p class="meta">Modal Edge · path depth ${path.length} · ${current.role}</p>
            <p>${current.blurb}</p>
            <p>
              The edge is <em>this</em> node’s color. Click it to slide this sheet down and right —
              ancestors stay underneath as colored layers (windows on windows). Pick a layer to
              jump to that node.
            </p>
            <ol class="me-crumb">
              ${path.map((n) => `<li>${n.label}</li>`).join('')}
            </ol>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        runTransition(() => {
          revealed = !revealed;
          render();
        });
      });
    });

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.goto;
        if (!id) return;
        runTransition(() => {
          currentId = id;
          revealed = false;
          render();
        });
      });
    });

    const sheet = root.querySelector('.me-sheet');
    if (sheet && revealed) {
      sheet.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('[data-toggle]')) return;
        runTransition(() => {
          revealed = false;
          render();
        });
      });
    }
  }

  render();
}
