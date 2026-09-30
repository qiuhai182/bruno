// Extract (key -> original English string) pairs from the HEAD diff of already-converted files.
const fs = require('fs');
const path = require('path');

const diff = fs.readFileSync(path.join(__dirname, 'tabs-head-diff.txt'), 'utf8');
const lines = diff.split(/\r?\n/);

const pairs = {}; // key -> english
let currentFile = null;
let hunkRemovals = []; // strings removed (in order)
let hunkAdditions = []; // keys added (in order)

function flushHunk() {
  // pair n-th removed string with n-th added key when counts align
  if (hunkRemovals.length && hunkRemovals.length === hunkAdditions.length) {
    hunkRemovals.forEach((s, i) => {
      const k = hunkAdditions[i];
      if (!pairs[k]) pairs[k] = s;
    });
  } else if (hunkRemovals.length === 1 && hunkAdditions.length >= 1) {
    // single removal spread over multiple additions (e.g. sentence split)
    if (!pairs[hunkAdditions[0]]) pairs[hunkAdditions[0]] = hunkRemovals[0];
  }
  hunkRemovals = [];
  hunkAdditions = [];
}

const STR_RE = /'([^'\n]+)'|"([^"\n]+)"/g;

for (const line of lines) {
  if (line.startsWith('diff --git')) {
    flushHunk();
    const m = line.match(/ b\/(.+)$/);
    currentFile = m ? m[1] : null;
    continue;
  }
  if (line.startsWith('@@')) { flushHunk(); continue; }
  if (line.startsWith('---') || line.startsWith('+++')) continue;
  if (!/ResponsePane|RequestTabs|ResponseExample/.test(currentFile || '')) continue;

  if (line.startsWith('-')) {
    const body = line.slice(1);
    // skip pure-code removals: only capture quoted literals that contain a space or are capitalized words
    let m;
    STR_RE.lastIndex = 0;
    while ((m = STR_RE.exec(body)) !== null) {
      const s = m[1] !== undefined ? m[1] : m[2];
      if (/[a-z]/.test(s) && (s.includes(' ') || /^[A-Z]/.test(s)) && !/^(use|react|lodash|classnames|@tabler|testid|data-)/i.test(s)) {
        if (!/^(http|text\/|application\/|image\/|base64|\.|\$\/)/.test(s)) {
          hunkRemovals.push(s);
        }
      }
    }
  } else if (line.startsWith('+')) {
    const body = line.slice(1);
    let m;
    const KEY_RE = /\bt\(\s*'([a-zA-Z][\w]*(?:\.[\w]+)+)'/g;
    while ((m = KEY_RE.exec(body)) !== null) {
      hunkAdditions.push(m[1]);
    }
  }
}
flushHunk();

const out = {};
Object.keys(pairs).sort().forEach((k) => { out[k] = pairs[k]; });
fs.writeFileSync(path.join(__dirname, 'tabs-pairs-extracted.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('extracted pairs:', Object.keys(out).length);
