import { mountPathWorkshop } from '../components/vanilla/mountPathEdge';
import { mountVanillaRails } from '../components/vanilla/mount';
import { mountModalEdge } from '../components/vanilla/mountModalEdge';

function bootMap(root: HTMLElement) {
  mountVanillaRails({ root, initialId: 'cloud' });
}

function boot() {
  const path = document.getElementById('path-edge-root');
  if (path) {
    path.replaceChildren();
    mountPathWorkshop({ root: path });
  }

  const map = document.getElementById('vanilla-root');
  if (map) {
    map.replaceChildren();
    bootMap(map);
  }

  const modal = document.getElementById('modal-edge-root');
  if (modal) {
    modal.replaceChildren();
    mountModalEdge({ root: modal, live: modal.dataset.live === '1' });
  }
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:after-swap', () => {
  window.scrollTo(0, 0);
});
