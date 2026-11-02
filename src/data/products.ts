import { links } from './links';

export const products = [
  {
    index: '01',
    id: 'rivet',
    name: 'Rivet',
    line: 'A coding agent on your phone.',
    tag: 'ANDROID · v1.1.1',
    href: '/work/rivet/',
    source: links.rivetSource,
  },
  {
    index: '02',
    id: 'freeline',
    name: 'Freeline',
    line: 'Which AI models are free right now.',
    tag: 'WEB · CHECKED EVERY 3H',
    href: links.freeline,
    source: null,
  },
  {
    index: '03',
    id: 'governer',
    name: 'Governer',
    line: 'Stops AI agents from overspending.',
    tag: 'PYTHON · PyPI',
    href: links.governerPypi,
    source: links.governerSource,
  },
] as const;
