/** A guessed URL is a 404, and a 404 is worse than an absence. */

export type ExternalLink = {
  readonly label: string;
  readonly href: string | null;
  readonly note?: string;
};

export const studio = {
  name: 'Vastraa Labs',
  descriptor: 'Independent software studio.',
  // The line under the wordmark has one job: say what the product is. The facts
  // underneath carry studio facts, so the two must not repeat each other.
  heroLine: 'Our first product is Rivet — a coding agent that works on a real project, from your phone.',
} as const;

export const site = {
  url: 'https://kaiser0733.github.io/vastraa-labs',
  ogImage: '/og.png',
} as const;

export const links = {
  github: { label: 'GitHub', href: 'https://github.com/Kaiser0733' } as ExternalLink,
  x: { label: 'X', href: 'https://x.com/Amardeep3307' } as ExternalLink,
  contact: { label: 'Email', href: 'mailto:vastraalabs.dev@gmail.com' } as ExternalLink,
  rivet: { label: 'Rivet', href: 'https://github.com/Kaiser0733/rivet' } as ExternalLink,
} as const;

export const isSet = (l: ExternalLink): l is ExternalLink & { href: string } => l.href !== null;

export const legal = {
  privacy: null as string | null,
  terms: null as string | null,
  security: null as string | null,
} as const;
