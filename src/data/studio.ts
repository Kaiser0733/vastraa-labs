import { links } from './links';

// A person shows a name only once one is set here. No invented names.
export const people = [
  {
    name: 'kaiser' as string | null,
    handle: null,
    role: 'Founder',
    github: links.github,
    x: links.x,
    instagram: links.kaiserInstagram,
  },
  {
    name: 'Rehan' as string | null,
    handle: null,
    role: 'Co-founder',
    github: null,
    x: null,
    instagram: links.rehanInstagram,
  },
] as const;
