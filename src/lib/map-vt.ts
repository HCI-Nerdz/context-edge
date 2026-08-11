export const mapVtStyles = [
  { id: 'off', label: 'Slide off' },
  { id: 'right', label: 'Right' },
  { id: 'down', label: 'Down' },
  { id: 'fade', label: 'Fade' },
  { id: 'scale', label: 'Scale' },
  { id: 'wipe', label: 'Wipe' },
] as const;

export type MapVtStyle = (typeof mapVtStyles)[number]['id'];

export const defaultMapVtStyle: MapVtStyle = 'off';

export function isMapVtStyle(value: string | undefined): value is MapVtStyle {
  return mapVtStyles.some((s) => s.id === value);
}

type TransitionHandle = {
  finished: Promise<void>;
  ready: Promise<void>;
};

type TransitionHost = {
  startViewTransition?: (update: () => void) => TransitionHandle;
};

let inflight: Promise<void> = Promise.resolve();

/**
 * Prefer a scoped stage VT so the page chrome is not snapshotted.
 * Document VT is clipped to the stage and drops every name except the sheet.
 */
export function runMapViewTransition(
  stage: HTMLElement,
  style: MapVtStyle,
  update: () => void,
): Promise<void> {
  stage.dataset.crVt = style;
  const run = () => play(stage, style, update);
  const next = inflight.then(run, run);
  inflight = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function play(stage: HTMLElement, style: MapVtStyle, update: () => void): Promise<void> {
  const scoped = typeof (stage as HTMLElement & TransitionHost).startViewTransition === 'function';
  const host = (scoped ? stage : document) as TransitionHost;

  if (typeof host.startViewTransition !== 'function') {
    update();
    return Promise.resolve();
  }

  const html = document.documentElement;
  stage.dataset.crVt = style;

  if (!scoped) pinDocumentVtToStage(stage, style);

  let t: TransitionHandle;
  try {
    t = host.startViewTransition(update);
  } catch {
    clearDocumentVtPin();
    update();
    return Promise.resolve();
  }

  void t.ready.catch(() => {
    /* skipped — DOM already updated */
  });

  return t.finished.then(clearDocumentVtPin, clearDocumentVtPin);
}

function pinDocumentVtToStage(stage: HTMLElement, style: MapVtStyle) {
  const html = document.documentElement;
  const r = stage.getBoundingClientRect();
  html.classList.add('is-map-vt');
  html.dataset.crVt = style;
  html.style.setProperty('--cr-vt-inset-t', `${Math.max(0, r.top)}px`);
  html.style.setProperty('--cr-vt-inset-r', `${Math.max(0, window.innerWidth - r.right)}px`);
  html.style.setProperty('--cr-vt-inset-b', `${Math.max(0, window.innerHeight - r.bottom)}px`);
  html.style.setProperty('--cr-vt-inset-l', `${Math.max(0, r.left)}px`);
}

function clearDocumentVtPin() {
  const html = document.documentElement;
  html.classList.remove('is-map-vt');
  delete html.dataset.crVt;
  html.style.removeProperty('--cr-vt-inset-t');
  html.style.removeProperty('--cr-vt-inset-r');
  html.style.removeProperty('--cr-vt-inset-b');
  html.style.removeProperty('--cr-vt-inset-l');
}
