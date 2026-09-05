/** @jsxImportSource react */
import { useEffect, useRef } from 'react';
import { mountPathWorkshop } from '../vanilla/mountPathEdge';

/** Shared Path Edge workshop (same suite as vanilla). */
export default function PathEdgeShell() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.replaceChildren();
    mountPathWorkshop({ root });
    return () => {
      root.replaceChildren();
    };
  }, []);

  return <div ref={rootRef} className="path-edge-host" />;
}
