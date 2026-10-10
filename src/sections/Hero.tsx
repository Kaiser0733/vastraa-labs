import { Mark } from '../components/Mark';
import { Icon } from '../components/Icon';
import { isSet, links, studio } from '../data/site';

const FACTS = [
  { icon: 'signal' as const, k: 'Studio', v: 'Two people' },
  { icon: 'package' as const, k: 'Builds', v: 'AI and automation' },
  { icon: 'phone' as const, k: 'Shipping', v: 'Rivet v0.11.0' },
];

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="shell">
        <div className="hero__grid">
          <div>
            <Mark size={34} className="hero__mark" />

            <h1 className="hero__title" id="hero-title">
              Vastraa Labs
            </h1>

            <p className="hero__line">{studio.heroLine}</p>

            <div className="hero__cta">
              <a className="btn btn--primary" href="#work">
                See Rivet
                <Icon name="arrow" size={16} />
              </a>
              {isSet(links.github) && (
                <a className="btn" href={links.github.href} target="_blank" rel="noreferrer noopener">
                  <Icon name="github" size={16} />
                  GitHub
                </a>
              )}
            </div>
          </div>

          <div className="hero__aside">
            <ul className="hero__facts">
              {FACTS.map((f) => (
                <li key={f.k}>
                  <Icon name={f.icon} size={16} />
                  <span className="mono hero__fact-k">{f.k}</span>
                  <span className="hero__fact-v">{f.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
