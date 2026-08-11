<script lang="ts">
  import { defaultPlatforms, findPlatform, type Platform } from '../../lib/platforms';

  type Props = {
    title?: string;
    platforms?: Platform[];
    initialId?: string;
  };

  let {
    title,
    platforms = defaultPlatforms,
    initialId = 'docs',
  }: Props = $props();

  let activeId = $state(initialId);
  let navOpen = $state(false);

  const active = $derived(findPlatform(platforms, activeId));
  const stageStyle = $derived(
    `--overlay: ${active.overlay}; --overlay-2: ${active.overlay2};`,
  );
</script>

<div>
  <div class="cr-toolbar">
    <span>
      Svelte island · community shell · {navOpen ? 'nav open' : 'rails idle'} · {active.label}
    </span>
  </div>

  <div class="cr-stage community" style={stageStyle}>
    <button
      type="button"
      class="cr-rail cr-rail-top"
      aria-label="Open ecosystem navigation"
      onclick={() => (navOpen = true)}
    >
      <span class="cr-rail-label">Communities</span>
    </button>
    <button
      type="button"
      class="cr-rail cr-rail-left"
      aria-label="Open platform navigation"
      onclick={() => (navOpen = true)}
    >
      <span class="cr-rail-label">Spaces</span>
    </button>

    <div class="cr-content">
      <h2>{title ?? active.label}</h2>
      <p class="meta">Reddit/SO-ish · softer edges · {active.role}</p>
      <p>{active.blurb}</p>
      <p>
        Subsection and role chrome belongs in the substrate map — not as ephemeral pills
        fighting the feed.
      </p>
    </div>

    {#if navOpen}
      <div
        class="cr-overlay"
        onclick={(e) => {
          if (e.target === e.currentTarget) navOpen = false;
        }}
      >
        <div class="cr-panel" role="dialog" aria-modal="true">
          <header>
            <h3>Wireframe community nav</h3>
            <button type="button" class="close" onclick={() => (navOpen = false)}>
              Close
            </button>
          </header>
          <div class="cr-wire">
            {#each platforms as p}
              <button
                type="button"
                class:current={p.id === activeId}
                onclick={() => {
                  activeId = p.id;
                  navOpen = false;
                }}
              >
                <strong>{p.label}</strong>
                <small>{p.role}</small>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
