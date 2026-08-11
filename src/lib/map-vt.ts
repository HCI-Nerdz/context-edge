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
 * Document VT so Astro's router and a scoped stage VT don't cancel each other.
 * Queues behind an in-flight map transition; still applies the DOM if VT is skipped.
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
  const doc = document as Document & TransitionHost;
  const html = document.documentElement;

  if (typeof doc.startViewTransition !== 'function') {
    update();
    return Promise.resolve();
  }

  html.classList.add('is-map-vt');
  html.dataset.crVt = style;
  stage.dataset.crVt = style;

  let t: TransitionHandle;
  try {
    t = doc.startViewTransition(update);
  } catch {
    html.classList.remove('is-map-vt');
    delete html.dataset.crVt;
    update();
    return Promise.resolve();
  }

  const done = () => {
    html.classList.remove('is-map-vt');
    delete html.dataset.crVt;
  };

  void t.ready.catch(() => {
    /* skipped (another page VT, hidden tab, etc.) — DOM already updated */
  });

  return t.finished.then(done, done);
}
