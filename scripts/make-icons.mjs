// Renders Kural Heart's icons from the mark's vectors (docs/canvas/project/Logo.dc.html) with resvg.
// Usage: node scripts/make-icons.mjs
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const FIGURE = `
  <path fill="#FFFFFF" d="M8 108C8 90 28 80 54 80 80 80 100 90 100 108Z"/>
  <path stroke="#E2DDD0" stroke-width="3" stroke-linecap="round" d="M70 84L57 108"/>
  <g transform="translate(-34.8 5.7) scale(.74)">
    <rect x="110" y="86" width="20" height="20" fill="#D17140"/>
    <circle cx="120" cy="22" r="13.5" fill="#232329"/>
    <rect x="85" y="54" width="12" height="18" rx="6" fill="#D17140"/>
    <rect x="143" y="54" width="12" height="18" rx="6" fill="#D17140"/>
    <path d="M90 48C90 26 150 26 150 48L150 62 90 62Z" fill="#232329"/>
    <rect x="93" y="39" width="54" height="51" rx="17" fill="#E08250"/>
    <path d="M102 50Q108 46.5 114 50M126 50Q132 46.5 138 50" stroke="#232329" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <circle cx="108" cy="57.5" r="3.6" fill="#232329"/><circle cx="132" cy="57.5" r="3.6" fill="#232329"/>
    <path d="M120 54L120 65Q124 66 125 63" stroke="#B85B2E" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    <path d="M120 112C100 100 89 89 89 77 89 69 95 64 102 64 109 64 114 68 120 73 126 68 131 64 138 64 145 64 151 69 151 77 151 89 140 100 120 112Z" fill="#232329"/>
    <path d="M107 79C112 88 128 88 133 79 128 83 112 83 107 79Z" fill="#E08250"/>
  </g>`;
const DAWN = `<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD08A"/><stop offset="1" stop-color="#E5693F"/></linearGradient></defs><rect width="108" height="108" fill="url(#d)"/>`;
const MONO = `<g transform="translate(54 56) scale(.78) translate(-54 -54)"><g transform="translate(-34.8 5.7) scale(.74)" fill="#000">
  <circle cx="120" cy="22" r="13.5"/>
  <rect x="96" y="42" width="48" height="45" rx="15" fill="none" stroke="#000" stroke-width="6"/>
  <circle cx="108" cy="57.5" r="4"/><circle cx="132" cy="57.5" r="4"/>
  <path d="M90 48C90 26 150 26 150 48L150 44C146 34 134 30 120 30 106 30 94 34 90 44Z"/>
  <path fill-rule="evenodd" d="M120 112C100 100 89 89 89 77 89 69 95 64 102 64 109 64 114 68 120 73 126 68 131 64 138 64 145 64 151 69 151 77 151 89 140 100 120 112ZM107 79C112 88 128 88 133 79 128 83 112 83 107 79Z"/>
</g></g>`;
// The notification glyph (Brand board): bun, hair and the heart beard with its smile, in white.
const GLYPH = `<g fill="#FFFFFF"><circle cx="12" cy="3.6" r="2.1"/><path d="M6.4 9.4C6.4 5.7 17.6 5.7 17.6 9.4V10H6.4Z"/>
  <path fill-rule="evenodd" d="M12 21.6C7.6 19 5.2 16.6 5.2 13.9 5.2 12 6.6 10.8 8.2 10.8 9.8 10.8 10.9 11.7 12 12.8 13.1 11.7 14.2 10.8 15.8 10.8 17.4 10.8 18.8 12 18.8 13.9 18.8 16.6 16.4 19 12 21.6ZM9.3 14.2C10.4 16.2 13.6 16.2 14.7 14.2 13.6 15 10.4 15 9.3 14.2Z"/></g>`;

const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}">${body}</svg>`;
function png(name, size, body, vb = 108) {
  const r = new Resvg(svg(vb, body), { fitTo: { mode: 'width', value: size } });
  writeFileSync(`assets/${name}`, r.render().asPng());
  console.log(name);
}
png('icon.png', 1024, DAWN + FIGURE);
png('android-icon-background.png', 1024, DAWN);
png('android-icon-foreground.png', 1024, FIGURE);
png('android-icon-monochrome.png', 1024, MONO);
png('splash-icon.png', 1024, `<clipPath id="c"><circle cx="54" cy="54" r="54"/></clipPath><g clip-path="url(#c)">${DAWN}${FIGURE}</g>`);
png('notification-icon.png', 96, GLYPH, 24);
png('favicon.png', 48, DAWN + FIGURE);
