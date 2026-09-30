// isolated test of parseOptions + applyInterp behavior
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
    const m = p.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
    if (m) out.push({ name: m[1], expr: m[2].trim().replace(/,\s*$/, '') });
  }
  return out;
}

function applyInterp(val, options) {
  let out = val, ok = true;
  const tpl = out.match(/^`([\s\S]*)`$/);
  if (tpl) out = tpl[1];
  out = out.replace(/\$\{([^}]*)\}/g, (_, expr) => {
    const e = expr.trim();
    const opt = options.find((o) => o.expr === e);
    if (opt) return `{{${opt.name}}}`;
    ok = false;
    return `\x05${e}\x06`;
  });
  if (options.length) {
    for (const o of options) {
      if (!o.expr) continue;
      const esc = o.expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![A-Za-z0-9_$])${esc}(?![A-Za-z0-9_$])`, 'g');
      if (re.test(out)) out = out.replace(re, `{{${o.name}}}`);
    }
    if (/\{\s*[A-Za-z_$]/.test(out)) ok = false;
  }
  return { val: out, ok };
}

const cases = [
  ["{ count: importIssues[collection.uid].filter((i) => i.severity === 'error').length }",
   "{importIssues[collection.uid].filter((i) => i.severity === 'error').length} item(s) skipped"],
  ['{ total: collectionPaths.length }', ' of {collectionPaths.length} selected'],
  ['{ name }', '`Example "${name}" created successfully`'],
  ['{ error: e }', "'An error occurred while creating the collection - ' + e"]
];
for (const [o, v] of cases) {
  const opts = parseOptions(o);
  const r = applyInterp(v, opts);
  console.log(JSON.stringify({ opts, v, out: r.val, ok: r.ok }, null, 1));
}
