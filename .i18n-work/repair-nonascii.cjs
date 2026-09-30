const fs = require('fs');
const path = require('path');

const BULLET = String.fromCharCode(0x2022);
const MID = String.fromCharCode(0xB7);
const ARROW = String.fromCharCode(0x2192);
const EMDASH = String.fromCharCode(0x2014);
const FFFD = String.fromCharCode(0xFFFD);
const bullets16 = BULLET.repeat(16);

const rep = (rel, fn) => {
  const p = path.join(__dirname, '..', rel);
  let s = fs.readFileSync(p, 'utf8');
  const after = fn(s);
  if (after !== s) {
    fs.writeFileSync(p, after, 'utf8');
    console.log('fixed', rel);
  } else {
    console.log('NOCHANGE', rel);
  }
};

const maskRe = /<span className="key-display-mask text-xs">\?{16}<\/span>/g;
const maskFix = '<span className="key-display-mask text-xs">' + bullets16 + '</span>';

rep('packages/bruno-app/src/components/Preferences/AI/ProviderCard.js', (s) => s.replace(maskRe, maskFix));
rep('packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js', (s) => s.replace(maskRe, maskFix));

rep('packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js', (s) =>
  s
    .split('\n')
    .map((l, i) => {
      if (i >= 9 && i <= 12 && l.includes(FFFD)) return l.split(FFFD).join(ARROW);
      if (l.includes('keymapAccept')) {
        return l.split(' ? <kbd>').join(' ' + MID + ' <kbd>').split('<kbd>?</kbd>').join('<kbd>' + ARROW + '</kbd>');
      }
      return l;
    })
    .join('\n')
);

rep('packages/bruno-app/src/components/Preferences/AI/SecurityPane.js', (s) => s.split(FFFD).join(EMDASH));
rep('packages/bruno-app/src/components/Preferences/AI/index.js', (s) => s.split(FFFD + FFFD).join(EMDASH));
rep('packages/bruno-app/src/components/Preferences/Cache/index.js', (s) => s.split(FFFD + FFFD).join(EMDASH));

// scope-wide residual check
const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
};
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'components');
let bad = 0;
for (const d of ['Preferences', 'AppTitleBar']) {
  for (const p of walk(path.join(base, d), [])) {
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes(FFFD)) {
      bad++;
      console.log('RESIDUAL FFFD:', path.relative(base, p));
    }
  }
}
console.log(bad === 0 ? 'no residual FFFD in scope' : ('residual files: ' + bad));
