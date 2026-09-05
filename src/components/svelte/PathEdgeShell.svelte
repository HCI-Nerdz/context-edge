<script lang="ts">
  import { onMount } from 'svelte';
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

  let { island = 'Svelte' }: Props = $props();

  let currentId = $state(demoPath.at(-1)!.id);
  let edge = $state<PathEdgeAxis>('top');
  let subtle = $state(false);
  let live = $state(false);
  let open = $state(false);
  let focus = $state<number | null>(null);
  let stageEl = $state<HTMLDivElement | undefined>();

  const list = $derived(pathThrough(currentId));
  const current = $derived(list.at(-1)!);
  const display = $derived(list.map((n, fromRoot) => ({ n, fromRoot })).reverse());
  const vars = $derived(pathStageVars(current));

  function layout() {
    if (!stageEl) return;
    sizePathStacks({
      stage: stageEl,
      count: list.length,
      live,
      focusFromRoot: focus,
      edge,
    });
  }

  onMount(() => {
    const ro = new ResizeObserver(() => layout());
    const bind = () => {
      ro.disconnect();
      stageEl?.querySelectorAll('.pe-top, .pe-left').forEach((el) => ro.observe(el));
      layout();
    };
    bind();
    return () => ro.disconnect();
  });

  $effect(() => {
    currentId;
    live;
    focus;
    edge;
    queueMicrotask(() => {
      layout();
    });
  });

  function hop(id: string) {
    if (id === currentId) return;
    if (stageEl) {
      namePathHops(stageEl, 'island');
      markPathLeaves(stageEl, id);
    }
    runDocViewTransition(() => (currentId = id));
  }

  function hint(e: PointerEvent) {
    if (!stageEl) return;
    if (subtle) {
      stageEl.querySelectorAll<HTMLElement>('.pe-seg').forEach((el) => {
        const sr = el.getBoundingClientRect();
        el.style.setProperty('--local-x', `${e.clientX - sr.left}px`);
        el.style.setProperty('--local-y', `${e.clientY - sr.top}px`);
      });
    }
    if (live) {
      const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
      if (t) {
        const next = Number(t.dataset.fromRoot);
        if (next !== focus) focus = next;
      }
    }
  }

  function setEdge(next: PathEdgeAxis) {
    edge = next;
    focus = null;
  }
</script>

<div>
  <div class="cr-toolbar pe-toolbar">
    <span>{island} island · Path Edge · {current.label}</span>
    <div class="mode-btns" role="group" aria-label="Edge placement">
      <button
        type="button"
        class="mode-btn"
        class:is-on={edge === 'top'}
        onclick={() => setEdge('top')}
      >
        Top
      </button>
      <button
        type="button"
        class="mode-btn"
        class:is-on={edge === 'left'}
        onclick={() => setEdge('left')}
      >
        Side
      </button>
    </div>
    <label>
      <input type="checkbox" bind:checked={subtle} />
      Subtle
    </label>
    <label>
      <input
        type="checkbox"
        checked={live}
        onchange={(e) => {
          live = e.currentTarget.checked;
          if (!live) focus = null;
        }}
      />
      Live
    </label>
  </div>
  <div
    bind:this={stageEl}
    class="pe-stage"
    class:is-tint={subtle}
    class:is-chroma={!subtle}
    class:is-live={live}
    class:is-open={open}
    data-edge={edge}
    style={`--page:${vars.page};--mono-top:${vars.monoTop};--mono-left:${vars.monoLeft};--blend:${subtle ? 'color' : 'normal'}`}
  >
    <div
      class="pe-rails"
      data-rails
      onpointerenter={() => (open = true)}
      onpointerleave={() => {
        open = false;
        focus = null;
      }}
      onpointermove={hint}
    >
      {#if edge === 'top'}
        <div class="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="Top path">
          <div class="pe-stack pe-stack-top">
            {#each display as { n, fromRoot } (n.id)}
              <button
                type="button"
                class="pe-seg pe-seg-top"
                class:is-here={n.id === current.id}
                data-goto={n.id}
                data-from-root={fromRoot}
                style={`--seg:${n.color};--mono:${pathSegMono(current, fromRoot, list.length)}`}
                title={`${n.label} · ${n.role}`}
                onclick={() => hop(n.id)}
              >
                <span class="pe-seg-color" aria-hidden="true"></span>
                <span class="pe-label">{n.label}</span>
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <div class="pe-left cr-rail cr-rail-left" role="toolbar" aria-label="Side path">
          <div class="pe-stack pe-stack-left">
            {#each display as { n, fromRoot } (n.id)}
              <button
                type="button"
                class="pe-seg pe-seg-left"
                class:is-here={n.id === current.id}
                data-goto={n.id}
                data-from-root={fromRoot}
                style={`--seg:${n.color};--mono:${pathSegMono(current, fromRoot, list.length)}`}
                title={`${n.label} · ${n.role}`}
                onclick={() => hop(n.id)}
              >
                <span class="pe-seg-color" aria-hidden="true"></span>
                <span class="pe-mark" aria-hidden="true">{n.mark}</span>
              </button>
            {/each}
          </div>
          <div class="pe-slack" aria-hidden="true"></div>
        </div>
      {/if}
    </div>
    <div class="cr-content pe-content">
      <h2>{current.label}</h2>
      <p class="meta">{current.role}</p>
      <p>{current.blurb}</p>
    </div>
  </div>
</div>
