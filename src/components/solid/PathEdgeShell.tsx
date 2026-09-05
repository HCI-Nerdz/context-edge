/** @jsxImportSource solid-js */
import { onCleanup, onMount } from 'solid-js';
import { mountPathWorkshop } from '../vanilla/mountPathEdge';

/** Shared Path Edge workshop (same suite as vanilla). */
export default function PathEdgeShell() {
  let rootEl: HTMLDivElement | undefined;

  onMount(() => {
    if (!rootEl) return;
    rootEl.replaceChildren();
    mountPathWorkshop({ root: rootEl });
    onCleanup(() => {
      rootEl?.replaceChildren();
    });
  });

  return <div ref={(el) => (rootEl = el)} class="path-edge-host" />;
}
