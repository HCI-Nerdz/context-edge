type VTDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

export function runDocViewTransition(update: () => void) {
  const doc = document as VTDoc;
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(update);
  } else {
    update();
  }
}
