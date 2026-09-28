import { Mark } from '../components/Mark';
import { Icon } from '../components/Icon';
import { isSet, legal, links, studio } from '../data/site';

const SOCIAL = [
  { key: 'github', icon: 'github' as const },
  { key: 'x', icon: 'x' as const },
  { key: 'contact', icon: 'mail' as const },
] as const;

const LEGAL_KEYS = ['privacy', 'terms', 'security'] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  const anySocial = SOCIAL.some((s) => isSet(links[s.key]));

  return (
    <footer className="band band--ink band--tight on-band">
      <div className="shell">
        <div className="foot">
          <div className="foot__brand">
            <p className="foot__mark">
              <Mark size={20} />
              {studio.name}
            </p>
            <p className="foot__desc">{studio.descriptor}</p>
          </div>

          {anySocial ? (
            <nav aria-label="Elsewhere">
              <ul className="foot__social">
                {SOCIAL.map((s) => {
                  const link = links[s.key];
                  if (!isSet(link)) return null;
                  const external = link.href.startsWith('http');
                  return (
                    <li key={s.key}>
                      <a
                        className="foot__link"
                        href={link.href}
                        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      >
                        <Icon name={s.icon} size={16} />
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>

        <div className="foot__colophon">
          <p className="mono">
            © <span className="num">{year}</span> {studio.name}
          </p>
          <p className="mono">No analytics. No trackers. No cookies.</p>
          <ul className="foot__legal">
            {LEGAL_KEYS.map((k) =>
              legal[k] ? (
                <li key={k}>
                  <a href={legal[k] as string}>{legal[k] === '' ? k : k}</a>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
