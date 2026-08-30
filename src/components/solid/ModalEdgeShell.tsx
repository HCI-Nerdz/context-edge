/** @jsxImportSource solid-js */
import { createSignal, For } from 'solid-js';
import { runModalViewTransition } from '../../lib/modal-vt';
import { demoAncestry, stackThrough } from '../../lib/nav-stack';

type Props = {
  island?: string;
  initialId?: string;
  /** When true, pointer near edges peeks the sheet (Live mode). */
  live?: boolean;
};

export default function ModalEdgeShell(props: Props) {
  const [currentId, setCurrentId] = createSignal(props.initialId ?? demoAncestry.at(-1)!.id);
  const [revealed, setRevealed] = createSignal(false);
  const live = () => props.live === true;
  let viewportEl: HTMLDivElement | undefined;
  let sheetEl: HTMLDivElement | undefined;

  const path = () => stackThrough(currentId());
  const current = () => path().at(-1)!;
  const ancestors = () => path().slice(0, -1);

  function clearPeek() {
    if (!revealed() && viewportEl) viewportEl.style.setProperty('--me-open', '0');
  }

  function withSheetVt(update: () => void) {
    if (!viewportEl || !sheetEl) {
      update();
      return;
    }
    const vp = viewportEl;
    const sheet = sheetEl;
    sheet.style.viewTransitionName = 'me-sheet';
    void runModalViewTransition(vp, update).finally(() => {
      sheet.style.viewTransitionName = '';
    });
  }

  function toggle() {
    clearPeek();
    withSheetVt(() => setRevealed((v) => !v));
  }

  function pick(id: string) {
    clearPeek();
    withSheetVt(() => {
      setCurrentId(id);
      setRevealed(false);
    });
  }

  function peek(e: PointerEvent) {
    if (!live() || revealed() || !viewportEl) return;
    const r = viewportEl.getBoundingClientRect();
    const top = Math.max(0, 1 - (e.clientY - r.top) / 72);
    const left = Math.max(0, 1 - (e.clientX - r.left) / 72);
    const t = Math.max(top, left);
    viewportEl.style.setProperty('--me-open', String(t));
  }

  function unpeek() {
    if (!revealed() && viewportEl) viewportEl.style.setProperty('--me-open', '0');
  }

  return (
    <div>
      <div class="cr-toolbar">
        <span>
          {props.island ?? 'Solid'} island · Modal Edge · {revealed() ? 'layers revealed' : 'sheet closed'} ·{' '}
          {current().label}
          {live() ? ' · Live' : ' · Rest'}
        </span>
        <button type="button" class="me-hint-btn" onClick={toggle}>
          {revealed() ? 'Close stack' : 'Open Context Edge'}
        </button>
      </div>
      <div
        ref={viewportEl}
        class="me-viewport"
        classList={{ 'is-revealed': revealed() }}
        style={{
          '--overlay': current().overlay,
          '--overlay-2': current().overlay2,
          '--me-open': revealed() ? '1' : '0',
        }}
        onPointerMove={peek}
        onPointerLeave={unpeek}
      >
        <div class="me-stack" aria-hidden={revealed() ? 'false' : 'true'}>
          <For each={ancestors()}>
            {(n, i) => (
              <button
                type="button"
                class="me-layer"
                style={{
                  '--layer-overlay': n.overlay,
                  '--layer-overlay-2': n.overlay2,
                  '--depth': String(i()),
                }}
                onClick={() => pick(n.id)}
              >
                <span class="me-layer-edge" aria-hidden="true" />
                <span class="me-layer-top">{n.label}</span>
                <span class="me-layer-body">
                  <strong>{n.label}</strong>
                  <small>{n.role}</small>
                </span>
              </button>
            )}
          </For>
        </div>
        <div
          ref={sheetEl}
          class="me-sheet"
          onClick={(e) => {
            if (!revealed()) return;
            if ((e.target as HTMLElement).closest('.cr-rail')) return;
            toggle();
          }}
        >
          <button
            type="button"
            class="cr-rail cr-rail-corner me-edge"
            aria-label="Reveal navigation stack from the corner"
            onClick={toggle}
          />
          <button
            type="button"
            class="cr-rail cr-rail-top me-edge"
            aria-label="Reveal navigation stack from top edge"
            onClick={toggle}
          >
            <span class="cr-rail-label">{current().label}</span>
          </button>
          <button
            type="button"
            class="cr-rail cr-rail-left me-edge"
            aria-label="Reveal navigation stack from left edge"
            onClick={toggle}
          />
          <div class="cr-content me-content">
            <h2>{current().label}</h2>
            <p class="meta">
              Modal Edge · path depth {path().length} · {current().role}
            </p>
            <p>{current().blurb}</p>
            <p>
              The edge is <em>this</em> node’s color. Click it to slide this sheet down and right —
              ancestors stay underneath as colored layers.
            </p>
            <ol class="me-crumb">
              <For each={path()}>{(n) => <li>{n.label}</li>}</For>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
