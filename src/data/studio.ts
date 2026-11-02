import { links } from './links';

// A person shows a name only once one is set here. No invented names.
export const people = [
  {
    name: 'Amardeep Kumar' as string | null,
    handle: 'kaiser',
    role: 'Founder',
    github: links.github,
    x: links.x,
  },
  {
    name: null as string | null,
    handle: null,
    role: 'Co-founder',
    github: null,
    x: null,
  },
] as const;
