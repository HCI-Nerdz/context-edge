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

type TransitionHost = {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/** Scoped VT on the stage when the browser has it; document VT otherwise. */
export function runMapViewTransition(
  stage: HTMLElement,
  style: MapVtStyle,
  update: () => void,
) {
  stage.dataset.crVt = style;
  const host = stage as HTMLElement & TransitionHost;
  if (typeof host.startViewTransition === 'function') {
    host.startViewTransition(update);
    return;
  }

  const doc = document as Document & TransitionHost;
  const html = document.documentElement;
  if (typeof doc.startViewTransition === 'function') {
    html.classList.add('is-map-vt');
    html.dataset.crVt = style;
    const t = doc.startViewTransition(update);
    void t.finished.finally(() => {
      html.classList.remove('is-map-vt');
      delete html.dataset.crVt;
    });
    return;
  }

  update();
}
