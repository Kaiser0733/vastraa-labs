import { launch } from './cdp.mjs';

const browser = await launch();
await browser.goto(process.argv[2] || 'http://127.0.0.1:4173/');

const r = await browser.evaluate(() => {
  const tnr = [...document.querySelectorAll('*')]
    .filter((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim() === 'Times New Roman')
    .slice(0, 5)
    .map((e) => ({
      tag: e.tagName,
      cls: e.className,
      stack: getComputedStyle(e).fontFamily,
      text: (e.textContent || '').trim().slice(0, 30),
    }));

  const cards = document.querySelector('.cards');
  const cs = cards ? getComputedStyle(cards) : null;
  const kids = cards
    ? [...cards.children].map((c) => ({
        cls: c.className,
        h: c.getBoundingClientRect().height,
        w: Math.round(c.getBoundingClientRect().width),
        svg: !!c.querySelector('svg'),
        txt: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      }))
    : [];

  const radii = {};
  for (const e of document.querySelectorAll('body *')) {
    const rr = getComputedStyle(e).borderRadius;
    if (rr && rr !== '0px') {
      const v = rr.split(' ')[0];
      (radii[v] = radii[v] || new Set()).add(e.className || e.tagName);
    }
  }

  const anim = [...document.querySelectorAll('*')]
    .filter((e) => getComputedStyle(e).animationName !== 'none')
    .map((e) => ({ cls: e.className, anim: getComputedStyle(e).animationName, txt: e.textContent.trim().slice(0, 24) }));

  return {
    tnr,
    cards: { display: cs?.display, cols: cs?.gridTemplateColumns, n: kids.length, kids },
    radii: Object.fromEntries(Object.entries(radii).map(([k, v]) => [k, [...v].slice(0, 3)])),
    anim: anim.slice(0, 8),
  };
});

console.log('--- Times New Roman sources:');
console.log(JSON.stringify(r.tnr, null, 1));
console.log('--- .cards:');
console.log(JSON.stringify(r.cards, null, 1));
console.log('--- radii:');
console.log(JSON.stringify(r.radii, null, 1));
console.log('--- animated:');
console.log(JSON.stringify(r.anim, null, 1));
await browser.close();
process.exit(0);
