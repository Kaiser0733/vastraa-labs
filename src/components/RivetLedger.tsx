import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { Mark } from './Mark';
import { changed, gate, ledger, totals } from '../data/rivet';

const STEP_MS = 1700;

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Outcome = 'pending' | 'approved' | 'declined';

export function RivetLedger() {
  const total = ledger.length;
  const stopAt = useMemo(() => ledger.findIndex((s) => s.wait) + 1, []);
  const still = reduced();

  const [playhead, setPlayhead] = useState(still ? total : 1);
  const [outcome, setOutcome] = useState<Outcome>('pending');
  const [holding, setHolding] = useState(false);
  const [away, setAway] = useState(false);
  const [pinned, setPinned] = useState(false);

  const done = outcome !== 'pending';
  const asked = playhead >= stopAt;
  const pos = total > 1 ? ((Math.max(playhead, 1) - 1) / (total - 1)) * 100 : 0;

  useEffect(() => {
    const onVis = () => setAway(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (still || holding || pinned || away || done || playhead >= stopAt) return;
    const id = window.setTimeout(() => setPlayhead((n) => Math.min(n + 1, total)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [still, holding, pinned, away, done, playhead, stopAt, total]);

  const decide = useCallback((next: Exclude<Outcome, 'pending'>) => {
    setOutcome(next);
    setPinned(true);
    setPlayhead(total);
  }, [total]);

  const replay = useCallback(() => {
    setOutcome('pending');
    setPinned(false);
    setPlayhead(1);
  }, []);

  return (
    <div
      className="device"
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => setHolding(false)}
      onFocusCapture={() => setHolding(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <div className="device__bar">
        <span className="device__proj">
          <Mark size={14} />
          <span className="mono">atlas</span>
        </span>
        <span className="mono device__where">on device</span>
      </div>

      <div className="device__body">
        <div className="track mono">
          <span className="track__label">exchange</span>
          <span className="track__rail" aria-hidden="true">
            {ledger.map((s) => (
              <span key={s.t} className="track__tick" />
            ))}
            <span className="track__mark" style={{ left: `${pos}%` }} />
          </span>
          <span className="num track__count">
            {String(Math.min(playhead, total)).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
        </div>

        <ol className="ledger">
          {ledger.map((step, i) => {
            const n = i + 1;
            const state = n < playhead ? 'read' : n === playhead ? 'current' : 'ahead';
            const cut = outcome === 'declined' && n > stopAt;
            return (
              <li key={step.t} className="ledger__step" data-state={state} data-who={step.who}>
                <span className="ledger__meta mono">
                  <span className="num">{step.t}</span>
                  <span className="ledger__who">{step.who}</span>
                </span>
                <div className="ledger__content">
                  {cut ? (
                    <p className="ledger__line ledger__line--cut">Held back.</p>
                  ) : (
                    step.lines.map((line) => (
                      <p className="ledger__line" key={line}>
                        {line}
                      </p>
                    ))
                  )}

                  {step.wait && !done ? (
                    <div className="gate">
                      <p className="gate__title">
                        <Icon name="shield" size={16} />
                        {gate.title}
                      </p>
                      <p className="gate__sub">{gate.sub}</p>
                      <div className="gate__row">
                        <button type="button" className="btn btn--primary" onClick={() => decide('approved')}>
                          <Icon name="check" size={16} />
                          {gate.approve}
                        </button>
                        <button type="button" className="btn" onClick={() => decide('declined')}>
                          {gate.decline}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step.wait && done ? (
                    <p className="ledger__note">
                      {outcome === 'approved' ? 'Approved.' : 'Held back.'}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>

        <p aria-live="polite" className="visually-hidden">
          {done
            ? outcome === 'approved'
              ? 'Change applied. Three files changed.'
              : 'Change declined. No files changed.'
            : asked
              ? 'Rivet is waiting on your decision.'
              : ''}
        </p>

        {outcome === 'approved' ? (
          <DiffSurface />
        ) : outcome === 'declined' ? (
          <p className="panel-empty">
            <Icon name="check" size={16} />
            {gate.declined}
          </p>
        ) : asked ? (
          <p className="panel-empty">Waiting on you.</p>
        ) : null}

        {done ? (
          <p className="replay">
            <button type="button" className="btn btn--quiet" onClick={replay}>
              <Icon name="arrowLeft" size={15} />
              Replay
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DiffSurface() {
  const [open, setOpen] = useState<number | null>(null);
  const [undone, setUndone] = useState(false);

  if (undone) {
    return (
      <div className="diff">
        <p className="panel-empty">
          <Icon name="arrowLeft" size={16} />
          Reverted. Project is clean.
        </p>
        <p className="replay">
          <button type="button" className="btn btn--quiet" onClick={() => setUndone(false)}>
            Undo the undo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="diff">
      {changed.map((file, i) => (
        <button
          key={file.path}
          type="button"
          className="diff__row"
          data-active={open === i}
          aria-expanded={open === i}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <span className="diff__path mono">{file.path}</span>
          <span className="diff__count num">
            +{file.added} −{file.removed}
          </span>
          <span className="diff__note">{file.note}</span>
        </button>
      ))}
      <div className="diff__foot">
        <span className="mono">
          <span className="num">{totals.files}</span> files ·{' '}
          <span className="num">+{totals.added}</span> <span className="num">−{totals.removed}</span>
        </span>
        <button type="button" className="btn btn--quiet" onClick={() => setUndone(true)}>
          <Icon name="arrowLeft" size={15} />
          Undo
        </button>
      </div>
    </div>
  );
}
