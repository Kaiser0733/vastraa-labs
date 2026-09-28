import { Icon } from '../components/Icon';
import { isSet, links } from '../data/site';

export function Lab() {
  return (
    <section className="band band--tint" id="lab" aria-labelledby="lab-title">
      <div className="shell">
        <div className="sec sec--split">
          <h2 className="sec__title sec__title--sm" id="lab-title">
            Lab
          </h2>
          <p className="sec__line">Experiments. One of them is becoming a product.</p>
        </div>

        <ul className="lab">
          <li className="lab__row">
            <a
              className="lab__link"
              href={isSet(links.rivet) ? links.rivet.href : '#work'}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="lab__icon">
                <Icon name="phone" size={18} />
              </span>
              <span className="lab__name">Rivet</span>
              <span className="lab__state" data-state="building">
                <span className="dot" aria-hidden="true" />
                In development
              </span>
              <Icon name="arrow" size={16} className="lab__go" />
            </a>
          </li>

          <li className="lab__row" data-empty="true">
            <span className="lab__icon">
              <Icon name="flask" size={18} />
            </span>
            <span className="lab__name">Nothing published yet</span>
            <span className="lab__state" data-state="empty">
              —
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
