/** @jsxImportSource solid-js */
import { createSignal, For, Show } from 'solid-js';
import {
  defaultPlatforms,
  findPlatform,
  type Platform,
} from '../../lib/platforms';

type Props = {
  title?: string;
  platforms?: Platform[];
  initialId?: string;
  showOverloadToggle?: boolean;
};

export default function ContextRailsShell(props: Props) {
  const platforms = () => props.platforms ?? defaultPlatforms;
  const [activeId, setActiveId] = createSignal(props.initialId ?? 'cloud');
  const [navOpen, setNavOpen] = createSignal(false);
  const [overload, setOverload] = createSignal(false);

  const active = () => findPlatform(platforms(), activeId());

  const stageStyle = () => ({
    '--overlay': active().overlay,
    '--overlay-2': active().overlay2,
  });

  return (
    <div>
      <div class="cr-toolbar">
        <Show when={props.showOverloadToggle !== false}>
          <label>
            <input
              type="checkbox"
              checked={overload()}
              onChange={(e) => setOverload(e.currentTarget.checked)}
            />
            Overload header
          </label>
        </Show>
        <span>
          Solid island · {navOpen() ? 'nav open' : 'rails idle'} · {active().label}
        </span>
      </div>

      <div
        class="cr-stage cloud"
        classList={{ 'is-overload': overload() }}
        style={stageStyle()}
      >
        <Show when={overload()}>
          <div
            style={{
              display: 'flex',
              'flex-wrap': 'wrap',
              gap: '0.35rem',
              padding: '0.55rem 0.75rem',
              'border-bottom': '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(0,0,0,0.45)',
            }}
          >
            <For each={platforms()}>
              {(p) => (
                <button
                  type="button"
                  style={{
                    border: '1px solid rgba(255,255,255,0.18)',
                    background:
                      p.id === activeId()
                        ? 'hsl(var(--overlay) / 0.35)'
                        : 'rgba(255,255,255,0.06)',
                    color: 'inherit',
                    'border-radius': '999px',
                    padding: '0.25rem 0.65rem',
                    'font-size': '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveId(p.id)}
                >
                  {p.label}
                </button>
              )}
            </For>
          </div>
        </Show>

        <Show when={!overload()}>
          <button
            type="button"
            class="cr-rail cr-rail-top"
            aria-label="Open ecosystem navigation"
            onClick={() => setNavOpen(true)}
          >
            <span class="cr-rail-label">Ecosystem</span>
          </button>
          <button
            type="button"
            class="cr-rail cr-rail-left"
            aria-label="Open platform navigation"
            onClick={() => setNavOpen(true)}
          >
            <span class="cr-rail-label">Platforms</span>
          </button>
        </Show>

        <div class="cr-content">
          <h2>{props.title ?? active().label}</h2>
          <p class="meta">Cloud-console parody · Solid signals · {active().role}</p>
          <p>{active().blurb}</p>
          <p>
            Hover an edge to expand the rail; click to summon the wireframe map. Toggle
            overload to paint platforms on the roof instead.
          </p>
        </div>

        <Show when={navOpen()}>
          <div class="cr-overlay" onClick={(e) => e.target === e.currentTarget && setNavOpen(false)}>
            <div class="cr-panel" role="dialog" aria-modal="true">
              <header>
                <h3>Wireframe ecosystem nav</h3>
                <button type="button" class="close" onClick={() => setNavOpen(false)}>
                  Close
                </button>
              </header>
              <div class="cr-wire">
                <For each={platforms()}>
                  {(p) => (
                    <button
                      type="button"
                      classList={{ current: p.id === activeId() }}
                      onClick={() => {
                        setActiveId(p.id);
                        setNavOpen(false);
                      }}
                    >
                      <strong>{p.label}</strong>
                      <small>{p.role}</small>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
