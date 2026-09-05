<script lang="ts">
  import { onMount } from 'svelte';
  import { mountPathWorkshop } from '../vanilla/mountPathEdge';

  let rootEl = $state<HTMLDivElement | undefined>();

  onMount(() => {
    if (!rootEl) return;
    rootEl.replaceChildren();
    mountPathWorkshop({ root: rootEl });
    return () => {
      rootEl?.replaceChildren();
    };
  });
</script>

<!-- Shared Path Edge workshop (same suite as vanilla). -->
<div bind:this={rootEl} class="path-edge-host"></div>
