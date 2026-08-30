type TransitionHandle = {
  finished: Promise<void>;
  ready: Promise<void>;
};

type TransitionHost = {
  startViewTransition?: (update: () => void) => TransitionHandle;
};

let inflight: Promise<void> = Promise.resolve();

/**
 * Scope Modal sheet VT to the viewport (Map-style pin) so page chrome does not morph.
 * Prefer Element.startViewTransition on the viewport when available.
 */
export function runModalViewTransition(
  viewport: HTMLElement,
  update: () => void,
): Promise<void> {
  const run = () => play(viewport, update);
  const next = inflight.then(run, run);
  inflight = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function play(viewport: HTMLElement, update: () => void): Promise<void> {
  const scoped =
    typeof (viewport as HTMLElement & TransitionHost).startViewTransition === 'function';
  const host = (scoped ? viewport : document) as TransitionHost;

  if (typeof host.startViewTransition !== 'function') {
    update();
    return Promise.resolve();
  }

  viewport.classList.add('is-vt');
  if (!scoped) pinDocumentVtToViewport(viewport);

  let t: TransitionHandle;
  try {
    t = host.startViewTransition(update);
  } catch {
    clearDocumentVtPin();
    viewport.classList.remove('is-vt');
    update();
    return Promise.resolve();
  }

  void t.ready.catch(() => {
    /* skipped */
  });

  return t.finished.then(
    () => {
      clearDocumentVtPin();
      viewport.classList.remove('is-vt');
    },
    () => {
      clearDocumentVtPin();
      viewport.classList.remove('is-vt');
    },
  );
}

function pinDocumentVtToViewport(viewport: HTMLElement) {
  const html = document.documentElement;
  const r = viewport.getBoundingClientRect();
  html.classList.add('is-modal-vt');
  html.style.setProperty('--me-vt-inset-t', `${Math.max(0, r.top)}px`);
  html.style.setProperty('--me-vt-inset-r', `${Math.max(0, window.innerWidth - r.right)}px`);
  html.style.setProperty('--me-vt-inset-b', `${Math.max(0, window.innerHeight - r.bottom)}px`);
  html.style.setProperty('--me-vt-inset-l', `${Math.max(0, r.left)}px`);
}

function clearDocumentVtPin() {
  const html = document.documentElement;
  html.classList.remove('is-modal-vt');
  html.style.removeProperty('--me-vt-inset-t');
  html.style.removeProperty('--me-vt-inset-r');
  html.style.removeProperty('--me-vt-inset-b');
  html.style.removeProperty('--me-vt-inset-l');
}
