// The build has to run in $HOME: /storage is FUSE and native .node binaries
// cannot load there. So the mirror carries real copies of every build input
// except src, which is a symlink.
//
// That arrangement is one typo away from silently building a stale config. A
// copied vite.config.ts is invisible to git and to the build, so the only safe
// answer is to copy them every time and prove the copies match.
import { readFileSync, existsSync, cpSync, lstatSync, realpathSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const SRC = resolve(process.argv[2] || '/storage/emulated/0/Repo/vastraa-labs');
const MIR = resolve(process.argv[3] || '/data/data/com.termux/files/home/vlab-build');

const COPIED = ['vite.config.ts', 'index.html', 'package.json', 'tsconfig.json', 'scripts', 'public'];
const LINKED = ['src'];

// A directory cannot be read as a file, so comparing with readFileSync reports
// every directory as drifted and the check is theatre. Walk both trees instead.
const walk = (root, rel = '') => {
  const out = new Map();
  for (const e of readdirSync(resolve(root, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) for (const [k, v] of walk(root, child)) out.set(k, v);
    else if (e.isFile()) out.set(child, readFileSync(resolve(root, child)).toString());
  }
  return out;
};

const differs = (_a, rel) => {
  const srcPath = resolve(SRC, rel);
  const mirPath = resolve(MIR, rel);
  const st = lstatSync(srcPath, { throwIfNoEntry: false });
  if (!st) return false;
  if (st.isDirectory()) {
    if (!existsSync(mirPath)) return true;
    const A = walk(SRC, rel);
    const B = walk(MIR, rel);
    if (A.size !== B.size) return true;
    for (const [k, v] of A) if (B.get(k) !== v) return true;
    return false;
  }
  if (!existsSync(mirPath)) return true;
  return readFileSync(srcPath).toString() !== readFileSync(mirPath).toString();
};

let synced = 0;
for (const rel of COPIED) {
  if (!existsSync(resolve(SRC, rel))) continue;
  const mirrorPath = resolve(MIR, rel);
  if (lstatSync(mirrorPath, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new Error(`${rel} is a symlink in the mirror — configs must be copies, or Node resolves modules on /storage`);
  }
  if (differs(SRC, rel)) {
    cpSync(resolve(SRC, rel), mirrorPath, { recursive: true, force: true });
    synced++;
    console.log(`synced  ${rel}`);
  }
}

for (const rel of LINKED) {
  const mirrorPath = resolve(MIR, rel);
  const st = lstatSync(mirrorPath, { throwIfNoEntry: false });
  if (!st?.isSymbolicLink()) throw new Error(`${rel} must be a symlink to the source tree in the mirror`);
  // resolve() normalises a path; only realpath follows the link itself.
  if (realpathSync(mirrorPath) !== realpathSync(resolve(SRC, rel))) {
    throw new Error(`${rel} points at ${realpathSync(mirrorPath)}, not ${realpathSync(resolve(SRC, rel))}`);
  }
}

// Read back from the mirror, not from intent. A sync that reports success while
// the build still reads an old file is the failure this script exists to prevent.
const drift = COPIED.filter((rel) => existsSync(resolve(MIR, rel)) && differs(SRC, rel));
if (drift.length) {
  console.error(`mirror still differs from source: ${drift.join(', ')}`);
  process.exit(1);
}

console.log(`mirror clean — ${synced} synced, ${COPIED.length} verified against ${relative(process.cwd(), SRC) || SRC}`);
process.exit(0);
