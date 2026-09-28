// A var() that resolves to nothing does not warn. The declaration is dropped and
// the property silently falls back to its initial value, so a typo in a token
// name looks exactly like a deliberate choice. This fails the build instead.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'src/styles';
const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
const css = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const missing = new Map();

for (const f of files) {
  readFileSync(join(dir, f), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (!defined.has(m[1]) && !missing.has(m[1])) missing.set(m[1], `${f}:${i + 1}`);
      }
    });
}

if (missing.size) {
  console.log('UNDEFINED CSS TOKENS');
  for (const [tok, where] of missing) console.log(`  ${tok}  first used at ${where}`);
  console.log(`\n${missing.size} unresolved token(s). A var() with no definition is dropped silently.`);
  process.exit(1);
}
console.log(`all ${defined.size} custom properties resolve — no dangling var()`);
process.exit(0);
