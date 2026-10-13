#!/usr/bin/env node
// Savvy Financial visual renderer.
// Turns a post's visuals.json into on-brand PNGs: carousel slides, story frames,
// a reel cover and end card, and a newsletter banner.
//
// Usage: node render_visuals.mjs path/to/visuals.json [outDir]
//   outDir defaults to a "visuals" folder next to the JSON file.
//
// Text markup inside any string:
//   [[word]]  accent word (gold italic serif in the Playbook; gold caps in Wealth Code)
//   \n        line break
//
// See references/visuals.md for the spec format and the design rules behind it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(require.resolve('playwright', { paths: [process.cwd(), '/usr/local/lib/node_modules', '/usr/lib/node_modules'] }))); }

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../assets');
const MIME = { '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const _cache = {};
// Inline assets as data URIs: pages loaded with setContent can't read file:// URLs.
const dataUri = (abs) => (_cache[abs] ??= `data:${MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(abs).toString('base64')}`);
const asset = (p) => dataUri(path.join(ASSETS, p));

const C = {
  navy: '#1B1E4B', navyLight: '#3A3E7A', navyDeep: '#11132F',
  gold: '#C9A961', goldLight: '#E8D38A', goldDeep: '#8B7A3C',
  cream: '#FAF7F0', creamDark: '#F0E9D6', charcoal: '#2A2A2A', gray: '#6B6B6B',
  sage: '#8CA987', terra: '#A84B2F',
};

const SIZES = {
  portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920],
  banner: [1800, 720], linkedin: [1200, 1200],
};

const SERIES = {
  playbook: { label: 'THE SAVVY PLAYBOOK', signA: "Don't just make more.", signB: 'Make what you have work smarter.' },
  wealthcode: { label: "WEALTH CODE: WOMEN'S EDITION", signA: '', signB: '' },
  general: { label: 'SAVVY FINANCIAL', signA: 'Creating confidence', signB: 'through financial independence' },
};

// Simple gold line icons, one metaphor per post.
const ICONS = {
  calendar: '<rect x="12" y="20" width="76" height="68" rx="6"/><line x1="12" y1="38" x2="88" y2="38"/><line x1="30" y1="10" x2="30" y2="28"/><line x1="70" y1="10" x2="70" y2="28"/><rect x="26" y="50" width="14" height="12"/><rect x="43" y="50" width="14" height="12" class="fill"/><rect x="60" y="50" width="14" height="12"/><rect x="26" y="68" width="14" height="12"/><rect x="43" y="68" width="14" height="12"/>',
  folder: '<path d="M10 28 h28 l8 9 h44 v48 h-80 z"/><line x1="10" y1="45" x2="90" y2="45"/><line x1="30" y1="62" x2="70" y2="62"/><line x1="30" y1="72" x2="58" y2="72"/>',
  shield: '<path d="M50 8 L86 22 V48 C86 70 70 84 50 92 C30 84 14 70 14 48 V22 Z"/><path d="M34 50 L46 62 L68 38"/>',
  house: '<path d="M12 48 L50 14 L88 48"/><path d="M22 40 V88 H78 V40"/><rect x="42" y="60" width="16" height="28"/>',
  heart: '<path d="M50 84 C20 64 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 64 50 84 Z"/>',
  umbrella: '<path d="M10 50 C10 26 30 12 50 12 C70 12 90 26 90 50 C84 44 76 44 70 50 C64 44 56 44 50 50 C44 44 36 44 30 50 C24 44 16 44 10 50 Z"/><path d="M50 50 V82 C50 90 38 90 38 82"/>',
  clock: '<circle cx="50" cy="50" r="38"/><path d="M50 26 V50 L66 60"/>',
  key: '<circle cx="30" cy="50" r="16"/><path d="M46 50 H88 M74 50 V62 M84 50 V60"/>',
  door: '<rect x="26" y="10" width="48" height="80"/><path d="M26 10 L58 18 V86 L26 90"/><circle cx="52" cy="54" r="2.5" class="fill"/>',
  mirror: '<ellipse cx="50" cy="42" rx="26" ry="32"/><path d="M50 74 V88 M36 90 H64"/><path d="M38 30 C42 24 48 22 54 22"/>',
  checklist: '<rect x="18" y="10" width="64" height="80" rx="5"/><path d="M28 32 l5 5 l9 -10 M50 32 H72 M28 52 l5 5 l9 -10 M50 52 H72 M28 72 l5 5 l9 -10 M50 72 H72"/>',
  family: '<circle cx="34" cy="28" r="10"/><circle cx="66" cy="28" r="10"/><circle cx="50" cy="56" r="7"/><path d="M18 88 V60 C18 48 50 48 50 60 M82 88 V60 C82 48 50 48 50 60 M38 88 V76 C38 66 62 66 62 76 V88"/>',
  table: '<path d="M10 48 H90 M20 48 V86 M80 48 V86"/><circle cx="30" cy="26" r="8"/><circle cx="50" cy="22" r="8"/><circle cx="70" cy="26" r="8"/><path d="M22 44 C22 36 38 36 38 44 M42 40 C42 32 58 32 58 40 M62 44 C62 36 78 36 78 44"/>',
  hourglass: '<path d="M24 10 H76 M24 90 H76 M30 10 C30 36 50 42 50 50 C50 58 30 64 30 90 M70 10 C70 36 50 42 50 50 C50 58 70 64 70 90"/><path d="M40 82 H60 L50 70 Z" class="fill"/>',
  scale: '<path d="M50 12 V86 M30 86 H70 M18 28 H82"/><path d="M18 28 L8 56 H28 Z M82 28 L72 56 H92 Z"/>',
  buckets: '<path d="M8 40 L14 84 H34 L40 40 Z M38 40 L44 84 H64 L70 40 Z"/><path d="M66 40 L72 84 H92 L98 40 Z"/><path d="M12 56 H36 M42 66 H66 M70 48 H94"/>',
  sunrise: '<path d="M10 70 H90 M22 82 H78"/><path d="M28 70 C28 56 38 46 50 46 C62 46 72 56 72 70"/><path d="M50 18 V32 M22 34 L30 42 M78 34 L70 42"/>',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function rich(s) {
  return esc(s)
    .replace(/(^|[\s(\n])"/g, '$1\u201C').replace(/"/g, '\u201D')      // curly double quotes
    .replace(/(\w)'(\w)/g, '$1\u2019$2')                               // apostrophes
    .replace(/[A-Za-z0-9\]\[]+(?:-[A-Za-z0-9\]\[]+)+/g, m => `<span style="white-space:nowrap">${m}</span>`) // keep hyphenated words whole
    .replace(/\[\[(.+?)\]\]/g, '<span class="acc">$1</span>')
    .replace(/\n/g, '<br>');
}
function icon(name, size = 150) {
  if (!name || !ICONS[name]) return '';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

function css(series, W, H) {
  const wc = series === 'wealthcode';
  return `
  @font-face{font-family:Playfair;src:url(${asset('fonts/playfair-display-latin-400-normal.woff2')});font-weight:400}
  @font-face{font-family:Playfair;src:url(${asset('fonts/playfair-display-latin-400-italic.woff2')});font-weight:400;font-style:italic}
  @font-face{font-family:Playfair;src:url(${asset('fonts/playfair-display-latin-600-normal.woff2')});font-weight:600}
  @font-face{font-family:Playfair;src:url(${asset('fonts/playfair-display-latin-600-italic.woff2')});font-weight:600;font-style:italic}
  @font-face{font-family:Playfair;src:url(${asset('fonts/playfair-display-latin-700-normal.woff2')});font-weight:700}
  @font-face{font-family:Body;src:url(${asset('fonts/Carlito-Regular.ttf')});font-weight:400}
  @font-face{font-family:Body;src:url(${asset('fonts/Carlito-Bold.ttf')});font-weight:700}
  @font-face{font-family:Body;src:url(${asset('fonts/Carlito-Italic.ttf')});font-style:italic}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{font-family:Body,sans-serif;-webkit-font-smoothing:antialiased}
  .frame{position:relative;width:${W}px;height:${H}px;overflow:hidden;display:flex;flex-direction:column}
  .navy{background:${C.navy};color:${C.cream}}
  .navy.glow{background:radial-gradient(ellipse at 50% 35%, ${C.navyLight} 0%, ${C.navy} 55%, ${C.navyDeep} 100%)}
  .cream{background:${C.cream};color:${C.navy}}
  .creamdark{background:${C.creamDark};color:${C.navy}}
  .photo{background-size:cover;background-position:center top}
  .photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg, rgba(27,30,75,.05) 0%, rgba(27,30,75,.55) 45%, rgba(17,19,47,.95) 100%)}
  .photo > *{position:relative;z-index:2}
  .top{display:flex;align-items:center;gap:22px;padding:${Math.round(H*0.055)}px 84px 0}
  .rule{height:2px;width:70px;background:${C.gold}}
  .label{font-family:Playfair,serif;font-size:24px;letter-spacing:.32em;color:${C.gold}}
  .cream .label,.creamdark .label{color:${C.goldDeep}}
  .cream .rule,.creamdark .rule{background:${C.goldDeep}}
  .content{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 84px;${wc ? 'align-items:center;text-align:center;' : ''}}
  .icon{color:${C.gold};margin-bottom:44px;flex:none}
  .cream .icon,.creamdark .icon{color:${C.goldDeep}}
  .kicker{font-family:Body;font-weight:700;font-size:30px;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};margin-bottom:28px}
  .cream .kicker,.creamdark .kicker{color:${C.goldDeep}}
  .title{font-family:Playfair,serif;font-weight:${wc ? 600 : 400};line-height:1.12;${wc ? 'text-transform:uppercase;letter-spacing:.01em;' : ''}}
  .title .acc{color:${C.gold};${wc ? 'font-weight:700;' : 'font-style:italic;'}}
  .cream .title .acc,.creamdark .title .acc{color:${C.goldDeep}}
  .body{font-family:Body;font-size:50px;line-height:1.36;margin-top:36px;max-width:900px;opacity:.95}
  .body .acc{color:${C.gold};font-weight:700}
  .cream .body .acc,.creamdark .body .acc{color:${C.goldDeep}}
  .quote{font-family:Playfair,serif;font-style:italic;line-height:1.3}
  .quote p{margin:0 0 26px}
  .list{list-style:none;margin-top:30px}
  .content[data-wc] .list{display:inline-block;text-align:left;align-self:center}
  .list li{font-family:Body;line-height:1.3;margin:0 0 26px;padding-left:64px;position:relative;text-align:left}
  .list li::before{content:"\\2192";position:absolute;left:0;color:${C.gold};font-weight:700}
  .cream .list li::before,.creamdark .list li::before{color:${C.goldDeep}}
  .list li .acc{color:${C.gold};font-weight:700}
  .bottom{display:flex;align-items:flex-end;justify-content:space-between;padding:0 84px ${Math.round(H*0.045)}px}
  .foot{font-family:Body;font-size:24px;color:${C.goldLight};opacity:.85;max-width:760px;line-height:1.3}
  .cream .foot,.creamdark .foot{color:${C.gray}}
  .swipe{font-family:Body;font-size:26px;letter-spacing:.2em;color:${C.gold}}
  .mono{width:110px;height:auto;flex:none}
  .sign{font-family:Playfair,serif}
  .sign .series{font-size:34px;letter-spacing:.3em;color:${C.gold};margin-top:54px}
  .sign .tag{font-size:40px;line-height:1.35;margin-top:18px}
  .sign .tag i{color:${C.goldLight}}
  .cream .sign .tag i,.creamdark .sign .tag i,.cream .sign .series,.creamdark .sign .series{color:${C.goldDeep}}
  .goldline{width:120px;height:2px;background:${C.gold};margin:40px ${wc ? 'auto' : '0'}}
  .fit{overflow:hidden}
  .story .body{font-size:58px}
  .story .kicker{font-size:36px}
  .story .icon{width:200px;height:200px}
  `;
}

function slideHTML(s, ctx) {
  const { series, W, H, idx, total } = ctx;
  const wc = series === 'wealthcode';
  const bg = s.bg || (idx === 0 ? 'navy' : (wc ? 'navy' : (idx % 2 ? 'cream' : 'navy')));
  const glow = wc && bg === 'navy' ? ' glow' : '';
  const photo = s.photo ? ` photo" style="background-image:url(${dataUri(path.resolve(ctx.baseDir || '.', s.photo))})` : '';
  const label = s.hideLabel ? '' : `<div class="top"><div class="rule"></div><div class="label">${esc(SERIES[series].label)}</div></div>`;
  const big = s.size || (s.layout === 'cover' ? (wc ? 100 : 96) : (s.layout === 'statement' ? (wc ? 96 : 88) : 80));
  let inner = '';
  const ic = s.icon ? icon(s.icon, s.layout === 'cover' ? 170 : 130) : '';
  switch (s.layout) {
    case 'quote':
      inner = `${ic}${s.kicker ? `<div class="kicker">${rich(s.kicker)}</div>` : ''}<div class="quote fit" style="font-size:${s.size || 66}px">${(s.lines || []).map(l => `<p>${rich(l)}</p>`).join('')}</div>${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}`;
      break;
    case 'list':
      inner = `${ic}${s.title ? `<div class="title fit" style="font-size:${s.size || 76}px">${rich(s.title)}</div>` : ''}<ul class="list" style="font-size:${s.itemSize || 52}px">${(s.items || []).map(i => `<li>${rich(i)}</li>`).join('')}</ul>${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}`;
      break;
    case 'signoff': {
      const sr = SERIES[series];
      inner = `${s.title ? `<div class="title fit" style="font-size:${s.size || 64}px">${rich(s.title)}</div>` : ''}${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}<div class="goldline"></div><div class="sign"><div class="series">${esc(sr.label)}</div>${sr.signA ? `<div class="tag">${esc(sr.signA)}<br><i>${esc(sr.signB)}</i></div>` : ''}</div>`;
      break;
    }
    default: // cover, statement, text
      inner = `${ic}${s.kicker ? `<div class="kicker">${rich(s.kicker)}</div>` : ''}<div class="title fit" style="font-size:${big}px">${rich(s.title)}</div>${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}`;
  }
  const left = s.footnote ? `<div class="foot">${rich(s.footnote)}</div>` : (idx === 0 && total > 1 ? '<div class="swipe">SWIPE &#8594;</div>' : '<div></div>');
  const monoHidden = s.layout === 'signoff' && false;
  return `<div class="frame ${bg}${glow}${photo}">${label}<div class="content"${wc ? ' data-wc' : ''}>${inner}</div><div class="bottom">${left}${monoHidden ? '' : `<img class="mono" src="${asset('sf-monogram-gold.png')}">`}</div></div>`;
}

function bannerHTML(b, series) {
  const sr = SERIES[series];
  const wc = series === 'wealthcode';
  return `<div class="frame navy${wc ? ' glow' : ''}" style="flex-direction:row;align-items:center;padding:0 110px;gap:80px">
    ${b.icon ? `<div style="flex:none">${icon(b.icon, 220)}</div>` : ''}
    <div style="flex:1">
      <div class="label" style="margin-bottom:30px">${esc(sr.label)}</div>
      <div class="title fit" style="font-size:${b.size || 78}px;${wc ? '' : ''}">${rich(b.title)}</div>
      ${b.body ? `<div class="body" style="font-size:36px;margin-top:24px">${rich(b.body)}</div>` : ''}
    </div>
    <img class="mono" style="width:130px;align-self:flex-end;margin-bottom:60px" src="${asset('sf-monogram-gold.png')}">
  </div>`;
}

function storyHTML(f, series, i = 0) {
  // Vertical 1080 x 1920. Keep text out of the top and bottom 250 px (platform UI zones).
  const s = { bg: i % 2 ? 'cream' : 'navy', size: f.layout === 'cover' ? 120 : 104, ...f };
  const html = slideHTML(s, { series, W: 1080, H: 1920, idx: 1, total: 1 });
  return html
    .replace('<div class="frame', '<div style="padding:250px 0" class="frame')
    .replace('class="top"', 'class="top" style="padding-top:20px"')
    .replace('class="content"', 'class="content story"');
}

function endcardHTML(e, series) {
  const sr = SERIES[series];
  return `<div class="frame navy${series === 'wealthcode' ? ' glow' : ''}" style="align-items:center;justify-content:center;text-align:center;padding:250px 90px">
    <img src="${asset('sf-monogram-gold.png')}" style="width:260px;margin-bottom:60px">
    <div class="label" style="font-size:34px">${esc(sr.label)}</div>
    ${sr.signA ? `<div class="sign"><div class="tag" style="font-size:46px;margin-top:30px">${esc(sr.signA)}<br><i>${esc(sr.signB)}</i></div></div>` : ''}
    ${e.title ? `<div class="title" style="font-size:56px;margin-top:50px">${rich(e.title)}</div>` : ''}
    <div class="foot" style="font-size:28px;margin-top:80px;max-width:880px;color:${C.goldLight}">${rich(e.disclosure || '')}</div>
  </div>`;
}

const FIT_JS = `
  (() => {
    const frame = document.querySelector('.frame');
    const content = document.querySelector('.content') || frame;
    const els = [...document.querySelectorAll('.title, .quote, .list, .body')];
    const over = () => content.scrollHeight > content.clientHeight + 1 || frame.scrollHeight > frame.clientHeight + 1;
    let guard = 0;
    while (over() && guard++ < 60) {
      els.forEach(el => { const fs = parseFloat(getComputedStyle(el).fontSize); el.style.fontSize = (fs * 0.95) + 'px'; });
    }
    return guard;
  })()`;

async function render(page, html, series, [W, H], out) {
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css(series, W, H)}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const shrinks = await page.evaluate(FIT_JS);
  await page.screenshot({ path: out });
  return shrinks;
}

async function main() {
  const specPath = process.argv[2];
  if (!specPath) { console.error('Usage: node render_visuals.mjs visuals.json [outDir]'); process.exit(2); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const outDir = path.resolve(process.argv[3] || path.join(path.dirname(specPath), 'visuals'));
  fs.mkdirSync(outDir, { recursive: true });
  const series = spec.series || 'playbook';
  const baseDir = path.dirname(path.resolve(specPath));
  const size = SIZES[spec.size || 'portrait'];
  const pad = (n) => String(n).padStart(2, '0');
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? {} : {});
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const made = [];
  const note = (f, shrinks) => { made.push(f); if (shrinks > 6) console.warn(`  note: ${path.basename(f)} text was shrunk ${shrinks}x to fit; consider shorter copy`); };

  const slides = spec.slides || [];
  for (let i = 0; i < slides.length; i++) {
    const f = path.join(outDir, `slide-${pad(i + 1)}.png`);
    note(f, await render(page, slideHTML(slides[i], { series, W: size[0], H: size[1], idx: i, total: slides.length, baseDir }), series, size, f));
  }
  if (spec.linkedin && slides.length) {
    const f = path.join(outDir, 'linkedin-cover.png');
    note(f, await render(page, slideHTML(slides[0], { series, W: 1200, H: 1200, idx: 0, total: 1 }), series, SIZES.linkedin, f));
  }
  for (let i = 0; i < (spec.story || []).length; i++) {
    const f = path.join(outDir, `story-${pad(i + 1)}.png`);
    note(f, await render(page, storyHTML(spec.story[i], series, i), series, SIZES.story, f));
  }
  if (spec.reelCover) {
    const f = path.join(outDir, 'reel-cover.png');
    note(f, await render(page, storyHTML({ layout: 'cover', ...spec.reelCover }, series), series, SIZES.story, f));
  }
  if (spec.endcard) {
    const f = path.join(outDir, 'reel-endcard.png');
    note(f, await render(page, endcardHTML(spec.endcard, series), series, SIZES.story, f));
  }
  if (spec.banner) {
    const f = path.join(outDir, 'newsletter-banner.png');
    note(f, await render(page, bannerHTML(spec.banner, series), series, SIZES.banner, f));
  }
  await browser.close();
  console.log(`Rendered ${made.length} images to ${outDir}`);
  made.forEach(f => console.log('  ' + path.basename(f)));
}

main().catch(e => { console.error(e); process.exit(1); });
