const fs = require('fs');
const p = 'd:/bruno/packages/bruno-app/src/components/GlobalSearchModal/index.js';
let s = fs.readFileSync(p, 'utf8');
const R = '\uFFFD';
const q = String.fromCharCode(39); // apostrophe
const replacements = 0;

// 1. comment: doesn<bad><bad>t -> doesn't
if (s.includes('doesn' + R + R + 't exist')) {
  s = s.replace('doesn' + R + R + 't exist', 'doesn' + q + 't exist');
  console.log('fixed comment');
}

// 2. keycap 1: up arrow
if (s.includes('">' + R + R + '</span>')) {
  s = s.replace('">' + R + R + '</span>', ">{ '\\u2191' }</span>");
  console.log('fixed keycap up');
}

// 3. keycap 2: down arrow
if (s.includes('">' + R + R + '</span>')) {
  s = s.replace('">' + R + R + '</span>', ">{ '\\u2193' }</span>");
  console.log('fixed keycap down');
}

// 4. keycap 3: enter (single '?' byte)
if (s.includes('true">?</span>')) {
  s = s.replace('true">?</span>', 'true">{ ' + q + '\\u21B5' + q + ' }</span>');
  console.log('fixed keycap enter');
}

// 5. resultsFound: count -> num
if (s.includes('{ count: results.length }')) {
  s = s.replace('{ count: results.length }', '{ num: results.length }');
  console.log('fixed resultsFound num');
}

fs.writeFileSync(p, s, 'utf8');

// verify no replacement chars remain
const check = fs.readFileSync(p, 'utf8');
console.log('remaining U+FFFD:', (check.match(new RegExp(R, 'g')) || []).length);
