import { Icon } from '../components/Icon';
import { RivetLedger } from '../components/RivetLedger';
import { loop, status } from '../data/rivet';
import { isSet, links } from '../data/site';

const LOOP_ICONS = ['package', 'signal', 'shield', 'check'] as const;

export function CurrentWork() {
  return (
    <section className="band band--tint" id="work" aria-labelledby="work-title">
      <div className="shell">
        <div className="sec">
          <p className="sec__kicker mono">
            <Icon name="phone" size={15} />
            Current work
          </p>
          <h2 className="sec__title" id="work-title">
            Rivet
          </h2>
          <p className="sec__line">
            A coding agent that lives on your phone. Say what you need, approve what matters,
            undo the rest.
          </p>
        </div>

        <div className="work">
          <RivetLedger />

          <div className="work__side">
            <ol className="loop">
              {loop.map((item, i) => (
                <li className="loop__row" key={item.step}>
                  <span className="loop__icon">
                    <Icon name={LOOP_ICONS[i] ?? 'check'} size={17} />
                  </span>
                  <span className="loop__body">
                    <span className="loop__step">{item.step}</span>
                    <span className="loop__note">{item.note}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="work__status">
              <p className="work__state">
                <span className="dot" aria-hidden="true" />
                {status.label}
              </p>
              {isSet(links.release) && (
                <a
                  className="btn btn--quiet"
                  href={links.release.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="package" size={16} />
                  {status.cta}
                </a>
              )}
              {isSet(links.rivet) && (
                <a
                  className="btn btn--quiet"
                  href={links.rivet.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="github" size={16} />
                  Source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
