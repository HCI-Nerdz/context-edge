<script lang="ts">
  import { runModalViewTransition } from '../../lib/modal-vt';
  import { demoAncestry, stackThrough } from '../../lib/nav-stack';

  type Props = {
    island?: string;
    initialId?: string;
    live?: boolean;
  };

  let {
    island = 'Svelte',
    initialId = demoAncestry.at(-1)!.id,
    live = false,
  }: Props = $props();

  let currentId = $state(initialId);
  let revealed = $state(false);
  let viewportEl = $state<HTMLDivElement | undefined>();
  let sheetEl = $state<HTMLDivElement | undefined>();

  const path = $derived(stackThrough(currentId));
  const current = $derived(path.at(-1)!);
  const ancestors = $derived(path.slice(0, -1));

  function clearPeek() {
    if (!revealed && viewportEl) viewportEl.style.setProperty('--me-open', '0');
  }

  function withSheetVt(update: () => void) {
    if (!viewportEl || !sheetEl) {
      update();
      return;
    }
    const vp = viewportEl;
    const sheet = sheetEl;
    sheet.style.viewTransitionName = 'me-sheet';
    void runModalViewTransition(vp, update).finally(() => {
      sheet.style.viewTransitionName = '';
    });
  }

  function toggle() {
    clearPeek();
    withSheetVt(() => (revealed = !revealed));
  }

  function pick(id: string) {
    clearPeek();
    withSheetVt(() => {
      currentId = id;
      revealed = false;
    });
  }

  function peek(e: PointerEvent) {
    if (!live || revealed || !viewportEl) return;
    const r = viewportEl.getBoundingClientRect();
    const top = Math.max(0, 1 - (e.clientY - r.top) / 72);
    const left = Math.max(0, 1 - (e.clientX - r.left) / 72);
    const t = Math.max(top, left);
    viewportEl.style.setProperty('--me-open', String(t));
  }

  function unpeek() {
    if (!revealed && viewportEl) viewportEl.style.setProperty('--me-open', '0');
  }
</script>

<div>
  <div class="cr-toolbar">
    <span>
      {island} › Modal Edge › {revealed ? 'layers revealed' : 'sheet closed'} › {current.label} ›
      {live ? 'Live' : 'Still'}
    </span>
  </div>
  <button
    type="button"
    class="ce-click-bubble"
    class:is-open={revealed}
    onclick={toggle}
    aria-label={revealed ? 'Close stack' : 'Open Context Edge — click the demo edge'}
  >
    <span class="ce-click-bubble-label">{revealed ? 'close' : 'click me'}</span>
    <span class="ce-click-bubble-tail" aria-hidden="true"></span>
  </button>
  <div
    bind:this={viewportEl}
    class="me-viewport"
    class:is-revealed={revealed}
    style={`--overlay:${current.overlay};--overlay-2:${current.overlay2};--me-open:${revealed ? 1 : 0}`}
    onpointermove={peek}
    onpointerleave={unpeek}
  >
    <div class="me-stack" aria-hidden={revealed ? 'false' : 'true'}>
      {#each ancestors as n, i}
        <button
          type="button"
          class="me-layer"
          style={`--layer-overlay:${n.overlay};--layer-overlay-2:${n.overlay2};--depth:${i}`}
          onclick={() => pick(n.id)}
        >
          <span class="me-layer-edge" aria-hidden="true"></span>
          <span class="me-layer-top">{n.label}</span>
          <span class="me-layer-body">
            <strong>{n.label}</strong>
            <small>{n.role}</small>
          </span>
        </button>
      {/each}
    </div>
    <div
      bind:this={sheetEl}
      class="me-sheet"
      onclick={(e) => {
        if (!revealed) return;
        if ((e.target as HTMLElement).closest('.cr-rail')) return;
        toggle();
      }}
    >
      <button
        type="button"
        class="cr-rail cr-rail-corner me-edge"
        aria-label="Reveal navigation stack from the corner"
        onclick={toggle}
      ></button>
      <button
        type="button"
        class="cr-rail cr-rail-top me-edge"
        aria-label="Reveal navigation stack from top edge"
        onclick={toggle}
      >
        <span class="cr-rail-label">{current.label}</span>
      </button>
      <button
        type="button"
        class="cr-rail cr-rail-left me-edge"
        aria-label="Reveal navigation stack from left edge"
        onclick={toggle}
      ></button>
      <div class="cr-content me-content">
        <h2>{current.label}</h2>
        <p class="meta">Modal Edge · path depth {path.length} · {current.role}</p>
        <p>{current.blurb}</p>
        <p>
          The edge is <em>this</em> node’s color. Click it to slide this sheet down and right —
          ancestors stay underneath as colored layers.
        </p>
        <ol class="me-crumb">
          {#each path as n}
            <li>{n.label}</li>
          {/each}
        </ol>
      </div>
    </div>
  </div>
</div>
