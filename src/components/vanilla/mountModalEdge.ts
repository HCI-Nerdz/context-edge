import { runModalViewTransition } from '../../lib/modal-vt';
import { demoAncestry, stackThrough, type NavNode } from '../../lib/nav-stack';

export type ModalEdgeOptions = {
  root: HTMLElement;
  nodes?: NavNode[];
  initialId?: string;
  /** Pointer near the edges peeks the sheet without a click. */
  live?: boolean;
};

/**
 * Modal Edge / Context Edge variant B:
 * Edge color = current node. Click slides the current sheet down+right
 * (scoped View Transitions when available) to reveal ancestor layers behind it.
 */
export function mountModalEdge(opts: ModalEdgeOptions) {
  const nodes = opts.nodes ?? demoAncestry;
  let currentId = opts.initialId ?? nodes[nodes.length - 1]!.id;
  let revealed = false;
  const root = opts.root;
  const live = opts.live === true;

  function stack(): NavNode[] {
    return stackThrough(currentId, nodes);
  }

  function withSheetVt(update: () => void) {
    const vp = root.querySelector('.me-viewport') as HTMLElement | null;
    const sheet = root.querySelector('.me-sheet') as HTMLElement | null;
    if (!vp) {
      update();
      return Promise.resolve();
    }
    if (sheet) sheet.style.viewTransitionName = 'me-sheet';
    return runModalViewTransition(vp, update).finally(() => {
      const s = root.querySelector('.me-sheet') as HTMLElement | null;
      if (s) s.style.viewTransitionName = '';
    });
  }

  function render() {
    const path = stack();
    const current = path[path.length - 1]!;
    const ancestors = path.slice(0, -1);

    root.innerHTML = `
      <div class="cr-toolbar">
        <span>
          Modal Edge › View Transitions ›
          ${revealed ? 'layers revealed' : 'sheet closed'} › ${current.label} ›
          ${live ? 'Live' : 'Still'}
        </span>
      </div>
      <button
        type="button"
        class="ce-click-bubble${revealed ? ' is-open' : ''}"
        data-toggle
        aria-label="${revealed ? 'Close navigation stack' : 'Click to open the Context Edge desk'}"
      >
        <span class="ce-click-bubble-label">${revealed ? 'Close stack' : 'click me'}</span>
        <span class="ce-click-bubble-tail" aria-hidden="true"></span>
      </button>
      <div
        class="me-viewport ${revealed ? 'is-revealed' : ''}"
        style="--overlay:${current.overlay};--overlay-2:${current.overlay2};--me-open:${revealed ? 1 : 0}"
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
              <span class="me-layer-top">${n.label}</span>
              <span class="me-layer-body">
                <strong>${n.label}</strong>
                <small>${n.role}</small>
              </span>
            </button>
          `,
            )
            .join('')}
        </div>

        <div class="me-sheet">
          <button
            type="button"
            class="cr-rail cr-rail-corner me-edge"
            data-toggle
            aria-label="Reveal navigation stack from the corner"
            style="--overlay:${current.overlay}"
          ></button>
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
          ></button>
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

    const vp = root.querySelector('.me-viewport') as HTMLElement;

    function clearPeek() {
      if (!revealed) vp.style.setProperty('--me-open', '0');
    }

    function applyReveal() {
      vp.classList.toggle('is-revealed', revealed);
      vp.style.setProperty('--me-open', revealed ? '1' : '0');
      const bubble = root.querySelector('.ce-click-bubble');
      if (bubble) {
        bubble.classList.toggle('is-open', revealed);
        bubble.setAttribute(
          'aria-label',
          revealed ? 'Close navigation stack' : 'Click to open the Context Edge desk',
        );
        const label = bubble.querySelector('.ce-click-bubble-label');
        if (label) label.textContent = revealed ? 'Close stack' : 'click me';
      }
      const stackEl = root.querySelector('.me-stack');
      stackEl?.setAttribute('aria-hidden', revealed ? 'false' : 'true');
    }

    root.querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        clearPeek();
        void withSheetVt(() => {
          revealed = !revealed;
          applyReveal();
        });
      });
    });

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.goto;
        if (!id) return;
        clearPeek();
        void withSheetVt(() => {
          currentId = id;
          revealed = false;
          render();
        });
      });
    });

    const sheet = root.querySelector('.me-sheet') as HTMLElement;
    sheet.addEventListener('click', (e) => {
      if (!revealed) return;
      if ((e.target as HTMLElement).closest('[data-toggle]')) return;
      clearPeek();
      void withSheetVt(() => {
        revealed = false;
        applyReveal();
      });
    });

    if (live) {
      const peek = (e: PointerEvent) => {
        if (revealed) return;
        const r = vp.getBoundingClientRect();
        const top = Math.max(0, 1 - (e.clientY - r.top) / 72);
        const left = Math.max(0, 1 - (e.clientX - r.left) / 72);
        const t = Math.max(top, left);
        vp.style.setProperty('--me-open', String(t));
      };
      vp.addEventListener('pointermove', peek);
      vp.addEventListener('pointerleave', () => {
        if (!revealed) vp.style.setProperty('--me-open', '0');
      });
    }
  }

  render();
}
