import fs from 'fs';

const b64 = fs.readFileSync('public/at-tech-logo-white-transparent.png').toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e7490" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#grad)" />
  <image href="data:image/png;base64,${b64}" x="8" y="8" width="84" height="84" />
</svg>`;

fs.writeFileSync('public/favicon.svg', svgContent);
console.log('Successfully generated public/favicon.svg!');
