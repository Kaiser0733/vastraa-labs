import { launch } from './cdp.mjs';

const browser = await launch();
await browser.goto(process.argv[2] || 'http://127.0.0.1:4173/');

const r = await browser.evaluate(() => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(probe);
  const resolve = (css) => {
    probe.style.color = '';
    probe.style.color = css;
    return { set: probe.style.color, computed: getComputedStyle(probe).color };
  };

  const bodyBgRaw = getComputedStyle(document.body).backgroundColor;
  const rootVar = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  const htmlRaw = getComputedStyle(document.documentElement).backgroundColor;
  const fromVar = resolve(`var(${rootVar ? '--paper' : '--ink'})`);

  // SVG foreignObject accepts the same CSS colour syntax a page does.
  const svgNs = 'http://www.w3.org/2000/svg';
  const fo = document.createElementNS(svgNs, 'foreignObject');
  const div = document.createElement('div');
  fo.appendChild(div);
  const svg = document.createElementNS(svgNs, 'svg');
  svg.appendChild(fo);
  document.body.appendChild(svg);
  div.style.color = rootVar;
  const foResult = getComputedStyle(div).color;

  const out = {
    bodyBgRaw,
    htmlRaw,
    rootVar,
    resolveVarPaper: fromVar,
    foFromVar: foResult,
    supportsOklch: CSS.supports('color', 'oklch(0.5 0.1 250)'),
  };
  svg.remove();
  probe.remove();
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
process.exit(0);
