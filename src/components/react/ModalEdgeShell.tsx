/** @jsxImportSource react */
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { runModalViewTransition } from '../../lib/modal-vt';
import { demoAncestry, stackThrough } from '../../lib/nav-stack';

type Props = {
  island?: string;
  initialId?: string;
  /** When true, pointer near edges peeks the sheet (Live mode). */
  live?: boolean;
};

export default function ModalEdgeShell({
  island = 'React',
  initialId = demoAncestry.at(-1)!.id,
  live = false,
}: Props) {
  const [currentId, setCurrentId] = useState(initialId);
  const [revealed, setRevealed] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const path = useMemo(() => stackThrough(currentId), [currentId]);
  const current = path.at(-1)!;
  const ancestors = path.slice(0, -1);

  function clearPeek() {
    if (!revealed && viewportRef.current) viewportRef.current.style.setProperty('--me-open', '0');
  }

  function withSheetVt(update: () => void) {
    const vp = viewportRef.current;
    const sheet = sheetRef.current;
    if (!vp || !sheet) {
      update();
      return;
    }
    sheet.style.viewTransitionName = 'me-sheet';
    void runModalViewTransition(vp, () => flushSync(update)).finally(() => {
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

  function peek(e: PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    if (!live || revealed || !vp) return;
    const r = vp.getBoundingClientRect();
    const top = Math.max(0, 1 - (e.clientY - r.top) / 72);
    const left = Math.max(0, 1 - (e.clientX - r.left) / 72);
    const t = Math.max(top, left);
    vp.style.setProperty('--me-open', String(t));
  }

  function unpeek() {
    if (!revealed && viewportRef.current) viewportRef.current.style.setProperty('--me-open', '0');
  }

  const vpStyle = {
    '--overlay': current.overlay,
    '--overlay-2': current.overlay2,
    '--me-open': revealed ? 1 : 0,
  } as CSSProperties;

  return (
    <div>
      <div className="cr-toolbar">
        <span>
          {island} › Modal Edge › {revealed ? 'layers revealed' : 'sheet closed'} › {current.label} ›{' '}
          {live ? 'Live' : 'Still'}
        </span>
      </div>
      <button
        type="button"
        className={`ce-click-bubble${revealed ? ' is-open' : ''}`}
        onClick={toggle}
        aria-label={revealed ? 'Close navigation stack' : 'Click to open the Context Edge desk'}
      >
        <span className="ce-click-bubble-label">{revealed ? 'Close stack' : 'click me'}</span>
        <span className="ce-click-bubble-tail" aria-hidden="true" />
      </button>
      <div
        ref={viewportRef}
        className={`me-viewport${revealed ? ' is-revealed' : ''}`}
        style={vpStyle}
        onPointerMove={peek}
        onPointerLeave={unpeek}
      >
        <div className="me-stack" aria-hidden={revealed ? 'false' : 'true'}>
          {ancestors.map((n, i) => (
            <button
              key={n.id}
              type="button"
              className="me-layer"
              style={
                {
                  '--layer-overlay': n.overlay,
                  '--layer-overlay-2': n.overlay2,
                  '--depth': i,
                } as CSSProperties
              }
              onClick={() => pick(n.id)}
            >
              <span className="me-layer-edge" aria-hidden="true" />
              <span className="me-layer-top">{n.label}</span>
              <span className="me-layer-body">
                <strong>{n.label}</strong>
                <small>{n.role}</small>
              </span>
            </button>
          ))}
        </div>
        <div
          ref={sheetRef}
          className="me-sheet"
          onClick={(e) => {
            if (!revealed) return;
            if ((e.target as HTMLElement).closest('.cr-rail')) return;
            toggle();
          }}
        >
          <button
            type="button"
            className="cr-rail cr-rail-corner me-edge"
            aria-label="Reveal navigation stack from the corner"
            onClick={toggle}
          />
          <button
            type="button"
            className="cr-rail cr-rail-top me-edge"
            aria-label="Reveal navigation stack from top edge"
            onClick={toggle}
          >
            <span className="cr-rail-label">{current.label}</span>
          </button>
          <button
            type="button"
            className="cr-rail cr-rail-left me-edge"
            aria-label="Reveal navigation stack from left edge"
            onClick={toggle}
          />
          <div className="cr-content me-content">
            <h2>{current.label}</h2>
            <p className="meta">
              Modal Edge · path depth {path.length} · {current.role}
            </p>
            <p>{current.blurb}</p>
            <p>
              The edge is <em>this</em> node’s color. Click it to slide this sheet down and right —
              ancestors stay underneath as colored layers.
            </p>
            <ol className="me-crumb">
              {path.map((n) => (
                <li key={n.id}>{n.label}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
