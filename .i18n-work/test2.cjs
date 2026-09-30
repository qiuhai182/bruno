// test the exact exportFailed case
function parseOptions(optsText) {
  if (!optsText || optsText === '<complex>') return [];
  const inner = optsText.replace(/^\{/, '').replace(/\}$/, '');
  const out = [];
  let depth = 0, cur = '', parts = [];
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '{' || c === '(' || c === '[') depth++;
    if (c === '}' || c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  if (cur.trim()) parts.push(cur);
  for (const p of parts) {
    let m = p.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
    if (m) out.push({ name: m[1], expr: m[2].trim().replace(/,\s*$/, '') });
    else {
      m = p.match(/^\s*([A-Za-z_$][\w$]*)\s*$/);
      if (m) out.push({ name: m[1], expr: m[1] });
    }
  }
  return out;
}
const opts = parseOptions('{ message })'.slice(0, 10)); // '{ message '
console.log('A', JSON.stringify(opts));
const opts2 = parseOptions('{ message }');
console.log('B', JSON.stringify(opts2));
