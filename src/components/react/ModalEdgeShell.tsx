/** @jsxImportSource react */
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { runDocViewTransition } from '../../lib/doc-vt';
import { demoAncestry, stackThrough } from '../../lib/nav-stack';

type Props = {
  island?: string;
  initialId?: string;
};

export default function ModalEdgeShell({
  island = 'React',
  initialId = demoAncestry.at(-1)!.id,
}: Props) {
  const [currentId, setCurrentId] = useState(initialId);
  const [revealed, setRevealed] = useState(false);
  const [live, setLive] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const path = useMemo(() => stackThrough(currentId), [currentId]);
  const current = path.at(-1)!;
  const ancestors = path.slice(0, -1);

  function toggle() {
    runDocViewTransition(() => flushSync(() => setRevealed((v) => !v)));
  }

  function pick(id: string) {
    runDocViewTransition(() =>
      flushSync(() => {
        setCurrentId(id);
        setRevealed(false);
      }),
    );
  }

  function peek(e: PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    const sheet = sheetRef.current;
    if (!live || revealed || !vp || !sheet) return;
    const r = vp.getBoundingClientRect();
    const top = Math.max(0, 1 - (e.clientY - r.top) / 72);
    const left = Math.max(0, 1 - (e.clientX - r.left) / 72);
    const t = Math.max(top, left);
    sheet.style.transform = `translate(${18 * t}%, ${22 * t}%) scale(${1 - 0.08 * t})`;
  }

  function unpeek() {
    if (!revealed && sheetRef.current) sheetRef.current.style.transform = '';
  }

  const vpStyle = {
    '--overlay': current.overlay,
    '--overlay-2': current.overlay2,
  } as CSSProperties;

  return (
    <div>
      <div className="cr-toolbar">
        <span>
          {island} island · Modal Edge · {revealed ? 'layers revealed' : 'sheet closed'} · {current.label}
        </span>
        <label>
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.currentTarget.checked)}
          />
          Live peek
        </label>
        <button type="button" className="me-hint-btn" onClick={toggle}>
          {revealed ? 'Close stack' : 'Open Edge Bar'}
        </button>
      </div>
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
          style={{ viewTransitionName: 'me-sheet' }}
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
          >
            <span className="cr-rail-label">{current.role}</span>
          </button>
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
