import { useEffect } from 'react';
import { Mark } from './Mark';
import { Icon } from './Icon';
import { links, isSet } from '../data/site';

const SECTIONS = ['work', 'lab'] as const;

const NAV = [
  { id: 'work', label: 'Rivet', icon: 'phone' as const },
  { id: 'lab', label: 'Lab', icon: 'flask' as const },
];

export function Masthead() {
  useEffect(() => {
    const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const anchors = new Map<string, HTMLAnchorElement>();
    document.querySelectorAll<HTMLAnchorElement>('.masthead__nav a[href^="#"]').forEach((a) => {
      const key = a.getAttribute('href')?.slice(1);
      if (key) anchors.set(key, a);
    });
    if (!targets.length || !anchors.size) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        for (const [id, a] of anchors) {
          if (seen.has(id)) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="masthead">
      <div className="shell masthead__inner">
        <a className="masthead__mark" href="#top">
          <Mark size={20} className="masthead__mark-icon" />
          <span>Vastraa Labs</span>
        </a>

        <nav className="masthead__nav" aria-label="Sections">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>
                  <Icon name={n.icon} size={15} />
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="masthead__social">
          {isSet(links.github) && (
            <a href={links.github.href} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
              <Icon name="github" size={17} />
            </a>
          )}
          {isSet(links.contact) && (
            <a href={links.contact.href} aria-label="Email">
              <Icon name="mail" size={17} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
