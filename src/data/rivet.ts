export type Step = {
  readonly t: string;
  readonly who: 'you' | 'rivet';
  readonly lines: readonly string[];
  readonly wait?: boolean;
};

export const ledger: readonly Step[] = [
  { t: 'T+00:00', who: 'you', lines: ['Fix the crash on launch.'] },
  { t: 'T+00:11', who: 'rivet', lines: ['Reading six modules. One entry point.'] },
  { t: 'T+00:19', who: 'rivet', lines: ['Found it — a binding read before init.'] },
  {
    t: 'T+00:21',
    who: 'rivet',
    lines: ['This touches three files. One is generated. Approve?'],
    wait: true,
  },
  { t: 'T+00:24', who: 'rivet', lines: ['Applied. Nothing else moved.'] },
  { t: 'T+00:26', who: 'rivet', lines: ['Three files changed. Undo any of it.'] },
];

export const gate = {
  title: 'Needs your call',
  sub: 'Nothing is written until you say so.',
  approve: 'Approve',
  decline: 'Not now',
  declined: 'No files changed. Nothing to review.',
} as const;

export const changed = [
  { path: '…/App.kt', added: 2, removed: 0, note: 'the fix' },
  { path: '…/Graph.kt', added: 8, removed: 3, note: 'guard the read' },
  { path: '…/Binding.kt', added: 2, removed: 0, note: 'generated' },
] as const;

export const totals = { files: 3, added: 12, removed: 3 } as const;

export const loop = [
  { step: 'Pick a project', note: 'A folder on your phone. That is the setup.' },
  { step: 'Say what you need', note: 'Plain words.' },
  { step: 'Approve the risky bit', note: 'Rivet stops and asks.' },
  { step: 'Look, or undo', note: 'Every change is reversible.' },
] as const;

export const status = {
  label: 'In development',
  cta: 'Follow the build',
} as const;
