import { mountPathWorkshop } from '../components/vanilla/mountPathEdge';
import { mountVanillaRails } from '../components/vanilla/mount';
import { mountModalEdge } from '../components/vanilla/mountModalEdge';

function bootMap(root: HTMLElement) {
  mountVanillaRails({ root, initialId: 'admin' });
  if (root.dataset.live !== '1') return;
  const stage = root.querySelector('.cr-stage') as HTMLElement | null;
  if (!stage) return;
  stage.classList.add('is-live');
  stage.addEventListener('pointermove', (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const top = Math.max(0, 1 - (e.clientY - r.top) / 80);
    const left = Math.max(0, 1 - (e.clientX - r.left) / 80);
    const t = Math.max(top, left);
    const idle = 0.35;
    const hover = 2.75;
    const v = `${idle + (hover - idle) * t}rem`;
    stage.style.setProperty('--rail-top', v);
    stage.style.setProperty('--rail-left', v);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.removeProperty('--rail-top');
    stage.style.removeProperty('--rail-left');
  });
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
