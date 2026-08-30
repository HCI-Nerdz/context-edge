/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import {
  defaultMapVtStyle,
  mapVtStyles,
  runMapViewTransition,
  type MapVtStyle,
} from '../../lib/map-vt';
import { appMockHtml, nodeSkin } from '../../lib/app-mock';
import { findOrg, orgIdFromEvent, orgTreeHtml } from '../../lib/org-tree';
import { readMockTheme, themeSwitchHtml } from '../../lib/theme';
import { bindTreePan, panTreeCurrentIntoView } from '../../lib/tree-pan';

type Props = {
  title?: string;
  initialId?: string;
};

export default function MapEdgeShell({
  initialId = 'gmail',
}: Props) {
  const [activeId, setActiveId] = useState(initialId);
  const [navOpen, setNavOpen] = useState(false);
  const [vtStyle, setVtStyle] = useState<MapVtStyle>(defaultMapVtStyle);
  const stageRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const active = useMemo(() => findOrg(activeId), [activeId]);

  useEffect(() => {
    const el = treeRef.current;
    if (!el) return;
    bindTreePan(el);
    if (navOpen) panTreeCurrentIntoView(el);
  }, [navOpen, activeId]);

  const stageStyle = {
    '--overlay': active.overlay,
    '--overlay-2': active.overlay2,
  } as CSSProperties;

  function reveal(open: boolean) {
    const stage = stageRef.current;
    const go = () => flushSync(() => setNavOpen(open));
    if (stage) runMapViewTransition(stage, vtStyle, go);
    else go();
  }

  function pick(id: string) {
    const stage = stageRef.current;
    const go = () =>
      flushSync(() => {
        setActiveId(id);
        setNavOpen(false);
      });
    if (stage) runMapViewTransition(stage, vtStyle, go);
    else go();
  }

  return (
    <div>
      <div className="cr-toolbar">
        <span>
          React island · suite shell · {navOpen ? 'map open' : 'rails idle'} ·{' '}
          {active.label}
        </span>
        <div dangerouslySetInnerHTML={{ __html: themeSwitchHtml('mock') }} />
        <nav className="variant-switch" aria-label="Transition style">
          <span className="variant-switch-name">Transition style</span>
          <div className="variant-switch-track" role="radiogroup">
            {mapVtStyles.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`variant-switch-item${s.id === vtStyle ? ' is-current' : ''}`}
                role="radio"
                aria-checked={s.id === vtStyle}
                onClick={() => setVtStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div
        ref={stageRef}
        className={`cr-stage suite${navOpen ? ' is-revealed' : ''}`}
        data-cr-vt={vtStyle}
        style={stageStyle}
      >
        <div className="cr-map" aria-hidden={navOpen ? 'false' : 'true'}>
          <div className="cr-map-head">
            <button type="button" className="close" onClick={() => reveal(false)}>
              Back
            </button>
            <div className="cr-map-copy">
              <h2>Suite map</h2>
              <p className="meta">
                Alphabet / Google product tree · demo map, not an official org chart
              </p>
            </div>
          </div>
          <div
            ref={treeRef}
            className="cr-tree"
            dangerouslySetInnerHTML={{ __html: orgTreeHtml(activeId) }}
            onClick={(e) => {
              const id = orgIdFromEvent(e.target);
              if (id) pick(id);
            }}
          />
        </div>

        <div className="cr-sheet" data-theme={readMockTheme()} data-skin={nodeSkin(active.id)}>
          <button
            type="button"
            className="cr-rail cr-rail-corner"
            aria-label="Open ecosystem navigation"
            onClick={() => reveal(true)}
          />
          <button
            type="button"
            className="cr-rail cr-rail-top"
            aria-label="Open ecosystem navigation"
            onClick={() => reveal(true)}
          >
            <span className="cr-rail-label">Suite map</span>
          </button>
          <button
            type="button"
            className="cr-rail cr-rail-left"
            aria-label="Open platform navigation"
            onClick={() => reveal(true)}
          >
            <span className="cr-rail-label">Products</span>
          </button>
          <div dangerouslySetInnerHTML={{ __html: appMockHtml(active) }} />
        </div>
      </div>
    </div>
  );
}
