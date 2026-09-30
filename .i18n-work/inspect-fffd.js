const fs = require('fs');
for (const p of [
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/ProviderCard.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js'
]) {
  const buf = fs.readFileSync(p);
  const s = buf.toString('utf8');
  console.log('===', p);
  s.split('\n').forEach((l, i) => {
    if (l.includes('\uFFFD')) {
      const idx = l.indexOf('\uFFFD');
      const hex = Buffer.from(l.slice(Math.max(0, idx - 4), idx + 8), 'utf8').toString('hex');
      console.log(i + 1, JSON.stringify(l.trim().slice(0, 80)), 'hex@', hex);
    }
  });
  // find the byte offsets of FFFD (EF BF BD)
  const fffd = Buffer.from([0xEF, 0xBF, 0xBD]);
  let pos = buf.indexOf(fffd);
  let count = 0;
  while (pos !== -1 && count < 5) {
    console.log('byte offset', pos, 'context hex:', buf.slice(Math.max(0, pos - 6), pos + 9).toString('hex'));
    pos = buf.indexOf(fffd, pos + 3);
    count++;
  }
}
