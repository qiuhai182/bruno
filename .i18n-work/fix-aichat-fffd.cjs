const fs = require('fs');
const p = 'd:/bruno/packages/bruno-app/src/components/AiChatSidebar/index.js';
let s = fs.readFileSync(p, 'utf8');
const F = '\uFFFD';
const ELL = '\\u2026'; // JS escape form so the file stays pure ASCII
const DASH = '\\u2014';

const lines = s.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].includes(F)) continue;
  const isComment = /^\s*\/\//.test(lines[i]);
  if (isComment) {
    lines[i] = lines[i].split(F).join('--');
    continue;
  }
  // code lines: 89 activity ellipsis
  if (lines[i].includes("activity.done")) {
    lines[i] = lines[i].split("'" + F + "'").join("'" + ELL + "'");
    lines[i] = lines[i].split(F).join(ELL);
    continue;
  }
  // 884 chat.method separator
  if (lines[i].includes('chat.method')) {
    lines[i] = lines[i].split('}' + F + ' ${').join('} ' + DASH + ' ${');
    lines[i] = lines[i].split(F).join(DASH);
    continue;
  }
  lines[i] = lines[i].split(F).join('--');
}
s = lines.join('\n');
fs.writeFileSync(p, s, 'utf8');

const chk = fs.readFileSync(p, 'utf8');
console.log('remaining FFFD:', chk.includes(F));
console.log('L89:', chk.split('\n')[88].trim().slice(0, 100));
console.log('L884:', chk.split('\n')[883].trim().slice(0, 100));
