// minimal repro of annotate + structuralSplit + emit for exportFailed line pair
const fs = require('fs');
// pull the functions by eval'ing the extractor up to the point before main loop is complex; instead copy the needed fns via require trick:
// simpler: re-implement call by extracting the file text and cutting at '/* ---------- main extraction'
let src = fs.readFileSync('d:/bruno/.i18n-work/extract-pairs2.cjs', 'utf8');
src = src.split('/* ---------- main extraction ----------')[0];
// remove the diff parsing part (it needs execSync but fine, it runs) — actually it's harmless.
src += `
const removed = "      toast.error('Failed to export collection: ' + message);";
const added = "      toast.error(t('sidebar.exportToPostman.exportFailed', { message }));";
const { lines: annAdds, phKeys } = annotate([added]);
console.log('annAdds:', JSON.stringify(annAdds));
console.log('phKeys:', JSON.stringify(phKeys));
const phSeq = [...annAdds[0].matchAll(/\\x00(\\d+)\\x01/g)].map(m => parseInt(m[1], 10));
console.log('phSeq:', phSeq);
const s = structuralSplit(removed, [annAdds[0]], phSeq.map(idx => phKeys[idx]));
console.log('split:', JSON.stringify(s));
if (s) {
  const v = cleanValue(s.vals[0], s.lits[0], s.lits[1] ?? '');
  console.log('cleanValue:', JSON.stringify(v));
  const r = applyInterp(v, phKeys[0].options);
  console.log('interp:', JSON.stringify(r));
}
`;
eval(src);
