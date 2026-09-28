import { Icon } from '../components/Icon';
import { principles } from '../data/principles';

export function Philosophy() {
  return (
    <section className="band" id="principles" aria-labelledby="principles-title">
      <div className="shell">
        <div className="sec sec--split">
          <h2 className="sec__title sec__title--sm" id="principles-title">
            How we work
          </h2>
          <p className="sec__line">Three things we actually do.</p>
        </div>

        <ul className="rules">
          {principles.map((p) => (
            <li className="rule" key={p.label}>
              <span className="rule__icon" aria-hidden="true">
                <Icon name={p.icon} size={20} />
              </span>
              <h3 className="rule__claim">{p.claim}</h3>
              <p className="rule__note">{p.note}</p>
              <span className="rule__label mono">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
