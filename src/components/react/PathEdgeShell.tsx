/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { runDocViewTransition } from '../../lib/doc-vt';
import {
  demoPath,
  markPathLeaves,
  namePathHops,
  pathSegMono,
  pathStageVars,
  pathThrough,
  sizePathStacks,
} from '../../lib/path-edge';

type Props = {
  island?: string;
};

export default function PathEdgeShell({ island = 'React' }: Props) {
  const [currentId, setCurrentId] = useState(demoPath.at(-1)!.id);
  const [subtle, setSubtle] = useState(false);
  const [live, setLive] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => pathThrough(currentId), [currentId]);
  const current = list.at(-1)!;
  const display = useMemo(
    () => list.map((n, fromRoot) => ({ n, fromRoot })).reverse(),
    [list],
  );
  const vars = pathStageVars(current);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const layout = () =>
      sizePathStacks({
        stage,
        count: list.length,
        live,
        focusFromRoot: focus,
      });
    const ro = new ResizeObserver(layout);
    stage.querySelectorAll('.pe-top, .pe-left').forEach((el) => ro.observe(el));
    layout();
    return () => ro.disconnect();
  }, [list, live, focus]);

  function hop(id: string) {
    if (id === currentId) return;
    const stage = stageRef.current;
    if (stage) {
      namePathHops(stage, 'island');
      markPathLeaves(stage, id);
    }
    runDocViewTransition(() => flushSync(() => setCurrentId(id)));
  }

  function hint(e: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage || !subtle) return;
    stage.querySelectorAll<HTMLElement>('.pe-seg, .pe-corner').forEach((el) => {
      const sr = el.getBoundingClientRect();
      el.style.setProperty('--local-x', `${e.clientX - sr.left}px`);
      el.style.setProperty('--local-y', `${e.clientY - sr.top}px`);
    });
    if (live) {
      const t = (e.target as HTMLElement).closest('[data-from-root]') as HTMLElement | null;
      if (t) {
        const next = Number(t.dataset.fromRoot);
        if (next !== focus) setFocus(next);
      }
    }
  }

  const stageStyle = {
    '--page': vars.page,
    '--mono-top': vars.monoTop,
    '--mono-left': vars.monoLeft,
    '--blend': subtle ? 'color' : 'normal',
  } as CSSProperties;

  return (
    <div>
      <div className="cr-toolbar">
        <span>
          {island} island · Path Edge · {current.label}
        </span>
        <label>
          <input
            type="checkbox"
            checked={subtle}
            onChange={(e) => setSubtle(e.currentTarget.checked)}
          />
          Subtle
        </label>
        <label>
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => {
              setLive(e.currentTarget.checked);
              if (!e.currentTarget.checked) setFocus(null);
            }}
          />
          Live
        </label>
      </div>
      <div
        ref={stageRef}
        className={`pe-stage${subtle ? ' is-tint' : ' is-chroma'}${live ? ' is-live' : ''}`}
        style={stageStyle}
        onPointerMove={hint}
        onPointerLeave={() => {
          if (!live) setFocus(null);
        }}
      >
        <div className="pe-rails" data-rails>
          <button
            type="button"
            className="pe-corner cr-rail cr-rail-corner"
            title={current.label}
            style={{ '--top-seg': current.color, '--left-seg': current.color } as CSSProperties}
            onClick={() => hop(current.id)}
          >
            <span className="pe-corner-miter" aria-hidden="true">
              <span className="pe-miter-top" />
              <span className="pe-miter-left" />
            </span>
            <span className="pe-corner-color" aria-hidden="true">
              <span className="pe-miter-top" />
              <span className="pe-miter-left" />
            </span>
          </button>
          <div className="pe-top cr-rail cr-rail-top" role="toolbar" aria-label="Top path">
            <div className="pe-stack pe-stack-top">
              {display.map(({ n, fromRoot }) => (
                <button
                  key={`t-${n.id}`}
                  type="button"
                  className={`pe-seg pe-seg-top${n.id === current.id ? ' is-here' : ''}`}
                  data-goto={n.id}
                  data-from-root={fromRoot}
                  style={
                    {
                      '--seg': n.color,
                      '--mono': pathSegMono(current, fromRoot, list.length),
                    } as CSSProperties
                  }
                  title={`${n.label} · ${n.role}`}
                  onClick={() => hop(n.id)}
                >
                  <span className="pe-seg-color" aria-hidden="true" />
                  <span className="pe-label">{n.label}</span>
                </button>
              ))}
            </div>
            <div className="pe-slack" aria-hidden="true" />
          </div>
          <div className="pe-left cr-rail cr-rail-left" role="toolbar" aria-label="Left path">
            <div className="pe-stack pe-stack-left">
              {display.map(({ n, fromRoot }) => (
                <button
                  key={`l-${n.id}`}
                  type="button"
                  className={`pe-seg pe-seg-left${n.id === current.id ? ' is-here' : ''}`}
                  data-goto={n.id}
                  data-from-root={fromRoot}
                  style={
                    {
                      '--seg': n.color,
                      '--mono': pathSegMono(current, fromRoot, list.length),
                    } as CSSProperties
                  }
                  title={`${n.label} · ${n.role}`}
                  onClick={() => hop(n.id)}
                >
                  <span className="pe-seg-color" aria-hidden="true" />
                  <span className="pe-mark" aria-hidden="true">
                    {n.mark}
                  </span>
                </button>
              ))}
            </div>
            <div className="pe-slack" aria-hidden="true" />
          </div>
        </div>
        <div className="cr-content pe-content">
          <h2>{current.label}</h2>
          <p className="meta">{current.role}</p>
          <p>{current.blurb}</p>
        </div>
      </div>
    </div>
  );
}
