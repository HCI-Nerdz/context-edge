/** @jsxImportSource solid-js */
import { createSignal, For, Show } from 'solid-js';
import {
  defaultMapVtStyle,
  mapVtStyles,
  runMapViewTransition,
  type MapVtStyle,
} from '../../lib/map-vt';
import { appMockHtml, nodeSkin } from '../../lib/app-mock';
import { findOrg, flattenOrg, orgIdFromEvent, orgTreeHtml } from '../../lib/org-tree';
import { readMockTheme, themeSwitchHtml } from '../../lib/theme';

type Props = {
  title?: string;
  initialId?: string;
  showOverloadToggle?: boolean;
};

export default function ContextRailsShell(props: Props) {
  const nodes = () => flattenOrg();
  const [activeId, setActiveId] = createSignal(props.initialId ?? 'cloud');
  const [navOpen, setNavOpen] = createSignal(false);
  const [overload, setOverload] = createSignal(false);
  const [vtStyle, setVtStyle] = createSignal<MapVtStyle>(defaultMapVtStyle);
  let stageEl: HTMLDivElement | undefined;

  const active = () => findOrg(activeId());

  const stageStyle = () => ({
    '--overlay': active().overlay,
    '--overlay-2': active().overlay2,
  });

  function reveal(open: boolean) {
    const go = () => setNavOpen(open);
    if (stageEl) runMapViewTransition(stageEl, vtStyle(), go);
    else go();
  }

  function pick(id: string) {
    const go = () => {
      setActiveId(id);
      setNavOpen(false);
    };
    if (stageEl) runMapViewTransition(stageEl, vtStyle(), go);
    else go();
  }

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
          Solid island · {navOpen() ? 'map open' : 'rails idle'} · {active().label}
        </span>
        <div innerHTML={themeSwitchHtml('mock')} />
        <nav class="variant-switch" aria-label="Transition style">
          <span class="variant-switch-name">Transition style</span>
          <div class="variant-switch-track" role="radiogroup">
            <For each={mapVtStyles}>
              {(s) => (
                <button
                  type="button"
                  class="variant-switch-item"
                  classList={{ 'is-current': s.id === vtStyle() }}
                  role="radio"
                  aria-checked={s.id === vtStyle()}
                  onClick={() => setVtStyle(s.id)}
                >
                  {s.label}
                </button>
              )}
            </For>
          </div>
        </nav>
      </div>

      <div
        ref={stageEl}
        class="cr-stage cloud"
        classList={{ 'is-overload': overload(), 'is-revealed': navOpen() }}
        data-cr-vt={vtStyle()}
        style={stageStyle()}
      >
        <div class="cr-map" aria-hidden={navOpen() ? 'false' : 'true'}>
          <div class="cr-map-head">
            <button type="button" class="close" onClick={() => reveal(false)}>
              Back
            </button>
            <h2>Ecosystem map</h2>
          </div>
          <p class="meta">Alphabet / Google product tree · demo map, not an official org chart</p>
          <div
            class="cr-tree"
            innerHTML={orgTreeHtml(activeId())}
            onClick={(e) => {
              const id = orgIdFromEvent(e.target);
              if (id) pick(id);
            }}
          />
        </div>

        <div class="cr-sheet" data-theme={readMockTheme()} data-skin={nodeSkin(active().id)}>
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
              <For each={nodes()}>
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
              class="cr-rail cr-rail-corner"
              aria-label="Open ecosystem navigation"
              onClick={() => reveal(true)}
            />
            <button
              type="button"
              class="cr-rail cr-rail-top"
              aria-label="Open ecosystem navigation"
              onClick={() => reveal(true)}
            >
              <span class="cr-rail-label">Ecosystem</span>
            </button>
            <button
              type="button"
              class="cr-rail cr-rail-left"
              aria-label="Open platform navigation"
              onClick={() => reveal(true)}
            >
              <span class="cr-rail-label">Platforms</span>
            </button>
          </Show>

          <div innerHTML={appMockHtml(active())} />
        </div>
      </div>
    </div>
  );
}
