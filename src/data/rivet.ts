import { links } from './links';

export const rivet = {
  version: 'v1.1.1',
  released: '2026.11.02',
  needs: 'Android 8.0+',
  license: 'Apache-2.0',
  apkFile: 'Rivet-v1.1.1.apk',
  githubAssetUrl: links.rivetGithubApk,
  mirrorUrl: '/downloads/Rivet-v1.1.1.apk',
  signingKey:
    '5A:94:51:92:C0:86:E9:41:2E:36:D3:AF:3F:5C:27:01:98:D5:81:98:2B:0A:7B:6E:9B:67:CF:F3:BC:7F:A8:0B',
  signingKeyShort: '5A:94:51:92…7F:A8:0B',
} as const;

// Files the mirror carries, newest first. Dates checked against the
// GitHub releases on 2026-11-02.
export const mirrorFiles = [
  { version: 'v1.1.1', file: 'Rivet-v1.1.1.apk', date: '2026.11.02' },
  { version: 'v1.1.0', file: 'Rivet-v1.1.0.apk', date: '2026.11.02' },
] as const;
