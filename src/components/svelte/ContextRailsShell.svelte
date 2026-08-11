<script lang="ts">
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

  let {
    title,
    initialId = 'youtube',
  }: Props = $props();

  let activeId = $state(initialId);
  let navOpen = $state(false);
  let vtStyle = $state<MapVtStyle>(defaultMapVtStyle);
  let stageEl = $state<HTMLDivElement | undefined>();
  let treeEl = $state<HTMLDivElement | undefined>();

  $effect(() => {
    if (!treeEl) return;
    bindTreePan(treeEl);
    if (navOpen) {
      activeId;
      queueMicrotask(() => treeEl && panTreeCurrentIntoView(treeEl));
    }
  });

  const active = $derived(findOrg(activeId));
  const stageStyle = $derived(
    `--overlay: ${active.overlay}; --overlay-2: ${active.overlay2};`,
  );

  function reveal(open: boolean) {
    const go = () => (navOpen = open);
    if (stageEl) runMapViewTransition(stageEl, vtStyle, go);
    else go();
  }

  function pick(id: string) {
    const go = () => {
      activeId = id;
      navOpen = false;
    };
    if (stageEl) runMapViewTransition(stageEl, vtStyle, go);
    else go();
  }
</script>

<div>
  <div class="cr-toolbar">
    <span>
      Svelte island · community shell · {navOpen ? 'map open' : 'rails idle'} · {active.label}
    </span>
    {@html themeSwitchHtml('mock')}
    <nav class="variant-switch" aria-label="Transition style">
      <span class="variant-switch-name">Transition style</span>
      <div class="variant-switch-track" role="radiogroup">
        {#each mapVtStyles as s}
          <button
            type="button"
            class="variant-switch-item"
            class:is-current={s.id === vtStyle}
            role="radio"
            aria-checked={s.id === vtStyle}
            onclick={() => (vtStyle = s.id)}
          >
            {s.label}
          </button>
        {/each}
      </div>
    </nav>
  </div>

  <div
    bind:this={stageEl}
    class="cr-stage community"
    class:is-revealed={navOpen}
    data-cr-vt={vtStyle}
    style={stageStyle}
  >
    <div class="cr-map" aria-hidden={navOpen ? 'false' : 'true'}>
      <div class="cr-map-head">
        <button type="button" class="close" onclick={() => reveal(false)}>Back</button>
        <div class="cr-map-copy">
          <h2>Community map</h2>
          <p class="meta">Alphabet / Google product tree · demo map, not an official org chart</p>
        </div>
      </div>
      <div
        class="cr-tree"
        bind:this={treeEl}
        onclick={(e) => {
          const id = orgIdFromEvent(e.target);
          if (id) pick(id);
        }}
      >
        {@html orgTreeHtml(activeId)}
      </div>
    </div>

    <div class="cr-sheet" data-theme={readMockTheme()} data-skin={nodeSkin(active.id)}>
      <button
        type="button"
        class="cr-rail cr-rail-corner"
        aria-label="Open ecosystem navigation"
        onclick={() => reveal(true)}
      ></button>
      <button
        type="button"
        class="cr-rail cr-rail-top"
        aria-label="Open ecosystem navigation"
        onclick={() => reveal(true)}
      >
        <span class="cr-rail-label">Communities</span>
      </button>
      <button
        type="button"
        class="cr-rail cr-rail-left"
        aria-label="Open platform navigation"
        onclick={() => reveal(true)}
      >
        <span class="cr-rail-label">Spaces</span>
      </button>

      {@html appMockHtml(active)}
    </div>
  </div>
</div>
