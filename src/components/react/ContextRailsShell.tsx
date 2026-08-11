/** @jsxImportSource react */
import { useMemo, useState, type CSSProperties } from 'react';
import {
  defaultPlatforms,
  findPlatform,
  type Platform,
} from '../../lib/platforms';

type Props = {
  title?: string;
  platforms?: Platform[];
  initialId?: string;
};

export default function ContextRailsShell({
  title,
  platforms = defaultPlatforms,
  initialId = 'mail',
}: Props) {
  const [activeId, setActiveId] = useState(initialId);
  const [navOpen, setNavOpen] = useState(false);
  const active = useMemo(
    () => findPlatform(platforms, activeId),
    [platforms, activeId],
  );

  const stageStyle = {
    '--overlay': active.overlay,
    '--overlay-2': active.overlay2,
  } as CSSProperties;

  return (
    <div>
      <div className="cr-toolbar">
        <span>
          React island · suite shell · {navOpen ? 'nav open' : 'rails idle'} ·{' '}
          {active.label}
        </span>
      </div>

      <div className="cr-stage suite" style={stageStyle}>
        <button
          type="button"
          className="cr-rail cr-rail-top"
          aria-label="Open ecosystem navigation"
          onClick={() => setNavOpen(true)}
        >
          <span className="cr-rail-label">Suite map</span>
        </button>
        <button
          type="button"
          className="cr-rail cr-rail-left"
          aria-label="Open platform navigation"
          onClick={() => setNavOpen(true)}
        >
          <span className="cr-rail-label">Products</span>
        </button>

        <div className="cr-content">
          <h2>{title ?? active.label}</h2>
          <p className="meta">
            Microsoft-suite-ish · duo-tone overlays · {active.role}
          </p>
          <p>{active.blurb}</p>
          <p>
            Rails stay in the shell. Content keeps a stable wash so you know which
            product world is active without a screaming header strip.
          </p>
        </div>

        {navOpen ? (
          <div
            className="cr-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setNavOpen(false);
            }}
          >
            <div className="cr-panel" role="dialog" aria-modal="true">
              <header>
                <h3>Wireframe suite nav</h3>
                <button
                  type="button"
                  className="close"
                  onClick={() => setNavOpen(false)}
                >
                  Close
                </button>
              </header>
              <div className="cr-wire">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={p.id === activeId ? 'current' : undefined}
                    onClick={() => {
                      setActiveId(p.id);
                      setNavOpen(false);
                    }}
                  >
                    <strong>{p.label}</strong>
                    <small>{p.role}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
