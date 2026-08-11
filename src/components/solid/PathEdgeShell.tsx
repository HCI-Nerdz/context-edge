/** @jsxImportSource solid-js */
import { createEffect, createSignal, For, onCleanup, onMount } from 'solid-js';
import { runDocViewTransition } from '../../lib/doc-vt';
import {
  demoPath,
  markPathLeaves,
  namePathHops,
  pathSegMono,
  pathStageVars,
  pathThrough,
  sizePathStacks,
} from '../../lib/path-edge';

type Props = {
  island?: string;
};

export default function PathEdgeShell(props: Props) {
  const [currentId, setCurrentId] = createSignal(demoPath.at(-1)!.id);
  const [subtle, setSubtle] = createSignal(false);
  const [live, setLive] = createSignal(false);
  const [focus, setFocus] = createSignal<number | null>(null);
  let stageEl: HTMLDivElement | undefined;

  const list = () => pathThrough(currentId());
  const current = () => list().at(-1)!;
  const display = () =>
    list()
      .map((n, fromRoot) => ({ n, fromRoot }))
      .reverse();
  const vars = () => pathStageVars(current());

  function layout() {
    if (!stageEl) return;
    sizePathStacks({
      stage: stageEl,
      count: list().length,
      live: live(),
      focusFromRoot: focus(),
    });
  }

  onMount(() => {
    const ro = new ResizeObserver(() => layout());
    if (stageEl) {
      stageEl.querySelectorAll('.pe-top, .pe-left').forEach((el) => ro.observe(el));
    }
    layout();
    onCleanup(() => ro.disconnect());
  });

  createEffect(() => {
    currentId();
    live();
    focus();
    queueMicrotask(layout);
  });

  function hop(id: string) {
    if (id === currentId()) return;
    if (stageEl) {
      namePathHops(stageEl, 'island');
      markPathLeaves(stageEl, id);
    }
    runDocViewTransition(() => setCurrentId(id));
  }

  function hint(e: PointerEvent) {
    if (!stageEl || !subtle()) return;
    stageEl.querySelectorAll<HTMLElement>('.pe-seg, .pe-corner').forEach((el) => {
      const sr = el.getBoundingClientRect();
      el.style.setProperty('--local-x', `${e.clientX - sr.left}px`);
      el.style.setProperty('--local-y', `${e.clientY - sr.top}px`);
    });
    if (live()) {
      const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
      if (t) {
        const next = Number(t.dataset.fromRoot);
        if (next !== focus()) setFocus(next);
      }
    }
  }

  return (
    <div>
      <div class="cr-toolbar">
        <span>
          {props.island ?? 'Solid'} island · Path Edge · {current().label}
        </span>
        <label>
          <input
            type="checkbox"
            checked={subtle()}
            onChange={(e) => setSubtle(e.currentTarget.checked)}
          />
          Subtle
        </label>
        <label>
          <input
            type="checkbox"
            checked={live()}
            onChange={(e) => {
              setLive(e.currentTarget.checked);
              if (!e.currentTarget.checked) setFocus(null);
            }}
          />
          Live
        </label>
      </div>
      <div
        ref={stageEl}
        class="pe-stage"
        classList={{ 'is-tint': subtle(), 'is-chroma': !subtle(), 'is-live': live() }}
        style={{
          '--page': vars().page,
          '--mono-top': vars().monoTop,
          '--mono-left': vars().monoLeft,
          '--blend': subtle() ? 'color' : 'normal',
        }}
        onPointerMove={hint}
        onPointerLeave={() => {
          if (!live()) setFocus(null);
        }}
      >
        <div class="pe-rails" data-rails>
          <button
            type="button"
            class="pe-corner cr-rail cr-rail-corner"
            title={current().label}
            style={{ '--top-seg': current().color, '--left-seg': current().color }}
            onClick={() => hop(current().id)}
          >
            <span class="pe-corner-miter" aria-hidden="true">
              <span class="pe-miter-top" />
              <span class="pe-miter-left" />
            </span>
            <span class="pe-corner-color" aria-hidden="true">
              <span class="pe-miter-top" />
              <span class="pe-miter-left" />
            </span>
          </button>
          <div class="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="Top path">
            <div class="pe-stack pe-stack-top">
              <For each={display()}>
                {({ n, fromRoot }) => (
                  <button
                    type="button"
                    class="pe-seg pe-seg-top"
                    classList={{ 'is-here': n.id === current().id }}
                    data-goto={n.id}
                    data-from-root={fromRoot}
                    style={{
                      '--seg': n.color,
                      '--mono': pathSegMono(current(), fromRoot, list().length),
                    }}
                    title={`${n.label} · ${n.role}`}
                    onClick={() => hop(n.id)}
                  >
                    <span class="pe-seg-color" aria-hidden="true" />
                    <span class="pe-label">{n.label}</span>
                  </button>
                )}
              </For>
            </div>
            <div class="pe-slack" aria-hidden="true" />
          </div>
          <div class="pe-left cr-rail cr-rail-left" role="toolbar" aria-label="Left path">
            <div class="pe-stack pe-stack-left">
              <For each={display()}>
                {({ n, fromRoot }) => (
                  <button
                    type="button"
                    class="pe-seg pe-seg-left"
                    classList={{ 'is-here': n.id === current().id }}
                    data-goto={n.id}
                    data-from-root={fromRoot}
                    style={{
                      '--seg': n.color,
                      '--mono': pathSegMono(current(), fromRoot, list().length),
                    }}
                    title={`${n.label} · ${n.role}`}
                    onClick={() => hop(n.id)}
                  >
                    <span class="pe-seg-color" aria-hidden="true" />
                    <span class="pe-mark" aria-hidden="true">
                      {n.mark}
                    </span>
                  </button>
                )}
              </For>
            </div>
            <div class="pe-slack" aria-hidden="true" />
          </div>
        </div>
        <div class="cr-content pe-content">
          <h2>{current().label}</h2>
          <p class="meta">{current().role}</p>
          <p>{current().blurb}</p>
        </div>
      </div>
    </div>
  );
}
