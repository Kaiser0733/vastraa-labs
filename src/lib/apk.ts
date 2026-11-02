import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { rivet } from '../data/rivet';

export interface ApkInfo {
  file: string;
  bytes: number;
  sizeMb: string;
  sha256: string;
  shaShort: string;
}

export function apkInfo(file: string): ApkInfo {
  const path = join(process.cwd(), 'public', 'downloads', file);
  if (!existsSync(path)) {
    throw new Error(`Missing APK in public/downloads/: ${file}`);
  }
  const data = readFileSync(path);
  const sha256 = createHash('sha256').update(data).digest('hex');
  return {
    file,
    bytes: data.length,
    sizeMb: (data.length / 1_000_000).toFixed(1),
    sha256,
    shaShort: `${sha256.slice(0, 8)}…${sha256.slice(-10)}`,
  };
}

// The current release must be mirrored, or the build fails.
export function currentApk(): ApkInfo {
  return apkInfo(rivet.apkFile);
}

export function listDownloadFiles(): string[] {
  return readdirSync(join(process.cwd(), 'public', 'downloads'))
    .filter((f) => f.endsWith('.apk'))
    .sort()
    .reverse();
}
