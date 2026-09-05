/** @jsxImportSource solid-js */
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { runDocViewTransition } from '../../lib/doc-vt';
import {
  demoPath,
  markPathLeaves,
  namePathHops,
  pathSegMono,
  pathStageVars,
  pathThrough,
  sizePathStacks,
  type PathEdgeAxis,
} from '../../lib/path-edge';

type Props = {
  island?: string;
};

export default function PathEdgeShell(props: Props) {
  const [currentId, setCurrentId] = createSignal(demoPath.at(-1)!.id);
  const [edge, setEdge] = createSignal<PathEdgeAxis>('top');
  const [subtle, setSubtle] = createSignal(false);
  const [live, setLive] = createSignal(false);
  const [open, setOpen] = createSignal(false);
  const [focus, setFocus] = createSignal<number | null>(null);
  let stageEl: HTMLDivElement | undefined;
  let observer: ResizeObserver | undefined;

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
      edge: edge(),
    });
  }

  function observeRails() {
    observer?.disconnect();
    observer = new ResizeObserver(() => layout());
    stageEl?.querySelectorAll('.pe-top, .pe-left').forEach((el) => observer!.observe(el));
    layout();
  }

  onMount(() => {
    observeRails();
    onCleanup(() => observer?.disconnect());
  });

  createEffect(() => {
    currentId();
    live();
    focus();
    edge();
    queueMicrotask(observeRails);
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
    if (!stageEl) return;
    if (subtle()) {
      stageEl.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const sr = el.getBoundingClientRect();
        el.style.setProperty('--local-x', `${e.clientX - sr.left}px`);
        el.style.setProperty('--local-y', `${e.clientY - sr.top}px`);
      });
    }
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
      <div class="cr-toolbar pe-toolbar">
        <span>
          {props.island ?? 'Solid'} island · Path Edge · {current().label}
        </span>
        <div class="mode-btns" role="group" aria-label="Edge placement">
          <button
            type="button"
            class="mode-btn"
            classList={{ 'is-on': edge() === 'top' }}
            onClick={() => {
              setEdge('top');
              setFocus(null);
            }}
          >
            Top
          </button>
          <button
            type="button"
            class="mode-btn"
            classList={{ 'is-on': edge() === 'left' }}
            onClick={() => {
              setEdge('left');
              setFocus(null);
            }}
          >
            Side
          </button>
        </div>
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
        classList={{
          'is-tint': subtle(),
          'is-chroma': !subtle(),
          'is-live': live(),
          'is-open': open(),
        }}
        data-edge={edge()}
        style={{
          '--page': vars().page,
          '--mono-top': vars().monoTop,
          '--mono-left': vars().monoLeft,
          '--blend': subtle() ? 'color' : 'normal',
        }}
      >
        <div
          class="pe-rails"
          data-rails
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => {
            setOpen(false);
            setFocus(null);
          }}
          onPointerMove={hint}
        >
          <Show
            when={edge() === 'top'}
            fallback={
              <div class="pe-left cr-rail cr-rail-left" role="toolbar" aria-label="Side path">
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
            }
          >
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
            </div>
          </Show>
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
