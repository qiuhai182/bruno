const fs = require('fs');
const p = 'd:/bruno/packages/bruno-app/src/components/AiChatSidebar/index.js';
let s = fs.readFileSync(p, 'utf8');
// collapse doubled JS escapes back to single
s = s.split('\\u2026\\u2026').join('\\u2026');
s = s.split('\\u2014\\u2014').join('\\u2014');
fs.writeFileSync(p, s, 'utf8');
const c = fs.readFileSync(p, 'utf8').split('\n');
console.log('L89:', c[88].trim().slice(0, 90));
console.log('L884:', c[883].trim().slice(0, 90));
