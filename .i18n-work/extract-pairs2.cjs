/* Extract key->original-English pairs from Sidebar/WorkspaceSidebar diff (v2, structural) */
const { execSync } = require('child_process');
const fs = require('fs');

const REPO = 'd:/bruno';
const DIFF_PATHS = 'packages/bruno-app/src/components/Sidebar packages/bruno-app/src/components/WorkspaceSidebar';

const diff = execSync(`git -C ${REPO} diff -U3 --no-color -- ${DIFF_PATHS}`, {
  maxBuffer: 64 * 1024 * 1024,
  encoding: 'utf8'
});

/* ---------- parse diff into blocks ---------- */
const files = [];
let curFile = null;
let curBlock = null;
for (const raw of diff.split('\n')) {
  const line = raw.replace(/\r$/, '');
  if (line.startsWith('diff --git ')) {
    const m = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    curFile = { file: m[2], blocks: [] };
    files.push(curFile);
    curBlock = null;
  } else if (!curFile) continue;
  else if (line.startsWith('@@')) {
    curBlock = { dels: [], adds: [] };
    curFile.blocks.push(curBlock);
  } else if (curBlock) {
    if (line.startsWith('-')) {
      if (curBlock.adds.length) { curBlock = { dels: [line.slice(1)], adds: [] }; curFile.blocks.push(curBlock); }
      else curBlock.dels.push(line.slice(1));
    } else if (line.startsWith('+')) curBlock.adds.push(line.slice(1));
    else if (line.startsWith(' ') && (curBlock.dels.length || curBlock.adds.length)) {
      curBlock = { dels: [], adds: [] };
      curFile.blocks.push(curBlock);
    }
  }
}

/* ---------- t() scanning ---------- */
function scanTCall(line, startIdx) {
  let i = startIdx; // at 't'
  i++; // '(' expected
  while (i < line.length && /\s/.test(line[i])) i++;
  if (line[i] !== '(') return null;
  i++;
  while (i < line.length && /\s/.test(line[i])) i++;
  const q = line[i];
  if (q !== "'" && q !== '"') return null;
  i++;
  let key = '';
  while (i < line.length && line[i] !== q) {
    if (line[i] === '\\') { key += line[i + 1]; i += 2; } else { key += line[i]; i++; }
  }
  if (line[i] !== q) return null;
  i++;
  while (i < line.length && /\s/.test(line[i])) i++;
  let options = null;
  if (line[i] === ',') {
    i++;
    while (i < line.length && /\s/.test(line[i])) i++;
    if (line[i] !== '{') return { key, options: '<complex>', end: i };
    const startOpts = i;
    let depth = 0;
    while (i < line.length) {
      const c = line[i];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
      else if (c === "'" || c === '"' || c === '`') { const qq = c; i++; while (i < line.length && line[i] !== qq) { if (line[i] === '\\') i++; i++; } }
      i++;
    }
    options = line.slice(startOpts, i).trim();
  }
  while (i < line.length && /\s/.test(line[i])) i++;
  if (line[i] !== ')') return { key, options, end: i, badClose: true };
  return { key, options, end: i + 1 };
}

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
      m = p.match(/^\s*([A-Za-z_$][\w$]*)\s*$/); // shorthand { name }
      if (m) out.push({ name: m[1], expr: m[1] });
    }
  }
  return out;
}

// iterate t-call occurrences on a line
function* tCalls(line) {
  const re = /(^|[^\w$.])t\s*\(/g;
  let m;
  while ((m = re.exec(line))) {
    const tIdx = m.index + m[1].length;
    const info = scanTCall(line, tIdx);
    yield { tIdx, info };
  }
}

/* ---------- annotate added lines with placeholders ---------- */
function annotate(added) {
  const phKeys = [];
  const dynamics = [];
  const nested = [];
  const lines = added.map((line) => {
    let out = '', lastCopied = 0;
    for (const { tIdx, info } of tCalls(line)) {
      if (tIdx < lastCopied) continue;
      if (!info) { dynamics.push(line.trim()); continue; }
      // nested keys inside options
      if (info.options && info.options !== '<complex>') {
        const nre = /\bt\(\s*(['"])((?:\\.|(?!\1).)*?)\1/g;
        let nm;
        while ((nm = nre.exec(info.options))) nested.push(nm[2]);
      }
      // consume surrounding JSX braces if they wrap only this call
      let start = tIdx, end = info.end;
      let s2 = start, e2 = end;
      let back = s2 - 1;
      while (back >= 0 && /\s/.test(line[back])) back--;
      let fwd = e2;
      while (fwd < line.length && /\s/.test(line[fwd])) fwd++;
      if (back >= 0 && line[back] === '{' && line[fwd] === '}') {
        // ensure nothing else inside braces: the text between '{' and t( is ws, and between ) and } is ws
        s2 = back; e2 = fwd + 1;
      }
      out += line.slice(lastCopied, s2);
      out += `\x00${phKeys.length}\x01`;
      phKeys.push({ key: info.key, options: parseOptions(info.options) });
      lastCopied = e2;
    }
    out += line.slice(lastCopied);
    return out;
  });
  return { lines, phKeys, dynamics, nested };
}

/* ---------- structural split: added = L0 ph0 L1 ph1 ... Lk ; removed = L0 V0 L1 V1 ... Lk ---------- */
function structuralSplit(removed, addedLines, phKeys) {
  const added = addedLines.join('\n');
  // locate placeholders in added
  const phSeq = [];
  const lits = [];
  let i = 0, lit = '';
  while (i < added.length) {
    if (added[i] === '\x00') {
      const j = added.indexOf('\x01', i);
      phSeq.push(parseInt(added.slice(i + 1, j), 10));
      lits.push(lit); lit = '';
      i = j + 1;
    } else { lit += added[i]; i++; }
  }
  lits.push(lit);
  const k = phSeq.length;
  // normalize removed: for joined multi-line, keep \n (lits contain them too)
  let r = removed;
  if (!r.startsWith(lits[0])) return null;
  const vals = new Array(k).fill(null);
  let cursor = lits[0].length;
  const tailLit = lits[lits.length - 1];
  if (tailLit !== '' && !r.endsWith(tailLit)) return null;
  const tailLimit = tailLit === '' ? r.length : r.length - tailLit.length;
  for (let p = 0; p < k; p++) {
    const nextLit = lits[p + 1];
    let endIdx;
    if (p === k - 1) {
      // last placeholder: value = remainder up to the tail literal
      endIdx = tailLimit;
    } else {
      const idx = r.indexOf(nextLit, cursor);
      if (idx < 0 || idx > tailLimit) return null;
      endIdx = idx;
    }
    vals[p] = r.slice(cursor, endIdx);
    cursor = endIdx + nextLit.length;
  }
  return { vals, lits };
}

/* ---------- value post-processing ---------- */
function unquoteStr(s) {
  const q = s[0];
  return s.slice(1, -1).replace(/\\(.)/g, (_, e) => ({ n: '\n', t: '\t', r: '\r' })[e] ?? e);
}

function cleanValue(v, litBefore, litAfter) {
  let val = v;
  // collapse joined newlines inside value (JSX text multi-line)
  if (val.includes('\n')) val = val.replace(/\n\s*/g, ' ');
  // strip string-literal quotes when clearly a JS literal
  const t = val.trim();
  const isLit = (t.startsWith("'") && t.endsWith("'") && t.length >= 2) || (t.startsWith('"') && t.endsWith('"') && t.length >= 2);
  const beforeTight = litBefore.trimEnd();
  const afterTight = litAfter.trimStart();
  const jsxBefore = beforeTight.endsWith('>');
  const jsxAfter = afterTight.startsWith('<');
  if (isLit && !jsxBefore && !jsxAfter) val = unquoteStr(t);
  return val;
}

function applyInterp(val, options) {
  let out = val, ok = true;
  // template literal?
  const tpl = out.match(/^`([\s\S]*)`$/);
  if (tpl) out = tpl[1];
  // replace ${expr} using options
  out = out.replace(/\$\{([^}]*)\}/g, (_, expr) => {
    const e = expr.trim();
    const opt = options.find((o) => o.expr === e);
    if (opt) return `{{${opt.name}}}`;
    ok = false;
    return `\x05${e}\x06`;
  });
  // string concat: 'TEXT' + EXPR  /  EXPR + 'TEXT'
  const c1 = out.match(/^'((?:\\.|[^'\\])*)'\s*\+\s*([\s\S]+)$/);
  if (c1) {
    const opt = options.find((o) => o.expr === c1[2].trim());
    if (opt) {
      out = c1[1].replace(/\\(.)/g, '$1') + `{{${opt.name}}}`;
    }
  } else {
    const c2 = out.match(/^([\s\S]+?)\s*\+\s*'((?:\\.|[^'\\])*)'$/);
    if (c2) {
      const opt = options.find((o) => o.expr === c2[1].trim());
      if (opt) {
        out = `{{${opt.name}}}` + c2[2].replace(/\\(.)/g, '$1');
      }
    }
  }
  // replace JSX expr containers {expr} using options
  if (options.length) {
    for (const o of options) {
      if (!o.expr) continue;
      if (out.includes(`{{${o.name}}}`)) continue; // already interpolated
      const esc = o.expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const container = new RegExp(`(?<!\\{)\\{\\s*${esc}\\s*\\}(?!\\})`, 'g');
      if (container.test(out)) out = out.replace(container, `{{${o.name}}}`);
      else {
        const bare = new RegExp(`(?<![A-Za-z0-9_$])${esc}(?![A-Za-z0-9_$])`, 'g');
        if (bare.test(out)) out = out.replace(bare, `{{${o.name}}}`);
      }
    }
    // leftover JSX expression that is not an interpolation placeholder
    if (/(?<!\{)\{\s*[A-Za-z_$]/.test(out)) ok = false;
  }
  return { val: out, ok };
}

/* ---------- main extraction ---------- */
const pairs = [];        // {key, value, file, status}
const conflicts = new Map(); // key -> [{value, file}]
const usedKeys = new Map();  // key -> Set(files)
const dynamicLines = [];     // {file, line}
const manualBlocks = [];     // {file, dels, adds, reason}
const nestedKeys = new Map(); // key -> Set(files)

for (const f of files) {
  for (const b of f.blocks) {
    if (!b.adds.length) continue;
    const { lines: annAdds, phKeys, dynamics, nested } = annotate(b.adds);
    for (const nk of nested) {
      if (!nestedKeys.has(nk)) nestedKeys.set(nk, new Set());
      nestedKeys.get(nk).add(f.file);
    }
    for (const d of dynamics) dynamicLines.push({ file: f.file, line: d });
    const blockKeyCount = phKeys.length;
    if (!blockKeyCount) continue;
    for (const pk of phKeys) {
      if (!usedKeys.has(pk.key)) usedKeys.set(pk.key, new Set());
      usedKeys.get(pk.key).add(f.file);
    }

    let split = null, mode = '';
    if (b.dels.length === annAdds.length) {
      // try per-line splits first
      let allOk = true;
      const perLine = [];
      for (let i = 0; i < annAdds.length; i++) {
        const linePh = [...annAdds[i].matchAll(/\x00(\d+)\x01/g)].map((m) => parseInt(m[1], 10));
        if (!linePh.length) { perLine.push({ vals: [], lits: [b.dels[i] === annAdds[i] ? null : b.dels[i]] , skip: true }); continue; }
        const s = structuralSplit(b.dels[i], [annAdds[i]], linePh.map((idx) => phKeys[idx]));
        if (!s) { allOk = false; break; }
        perLine.push({ ...s, phIdxs: linePh });
      }
      if (allOk) {
        split = { perLine }; mode = 'pair';
      }
    }
    if (!split) {
      const s = structuralSplit(b.dels.join('\n'), annAdds, phKeys);
      if (s) { split = { joined: s, phIdxs: phKeys.map((_, i) => i) }; mode = 'joined'; }
    }
    if (!split) {
      manualBlocks.push({ file: f.file, dels: b.dels.join('\n'), adds: b.adds.join('\n'), reason: 'structural-split-failed' });
      continue;
    }

    const emit = (val, pk, litBefore, litAfter) => {
      let v = cleanValue(val, litBefore, litAfter);
      let status = 'ok';
      // strip a JSX expression container wrapping the whole value ({ ... } whose first { closes at the end)
      if (/^\{[\s\S]*\}$/.test(v)) {
        let depth = 0;
        for (let i = 0; i < v.length; i++) {
          if (v[i] === '{') depth++;
          else if (v[i] === '}') { depth--; if (depth === 0) { if (i === v.length - 1) v = v.slice(1, -1).trim(); break; } }
        }
      }
      if (pk.options && pk.options.length) {
        const r = applyInterp(v, pk.options);
        v = r.val;
        if (!r.ok) status = 'interp-unresolved';
      } else if (/\$\{[^}]*\}/.test(v)) {
        const r = applyInterp(v, []);
        v = r.val;
        status = 'interp-unresolved';
      }
      if (/&#?\w+;/.test(v)) status = 'html-entity';
      if (/<[a-zA-Z/]/.test(v)) status = 'jsx-in-value';
      if (v.includes('\x05')) status = 'interp-unresolved';
      const tv = v.trim();
      if (/^[A-Za-z_$][\w$]*(\.[\w$?]+)+$/.test(tv) || /^[A-Za-z_$][\w$]*\s*\(/.test(tv)) status = 'code-in-value';
      pairs.push({ key: pk.key, value: v, file: f.file, status, mode });
    };

    if (split.perLine) {
      for (const pl of split.perLine) {
        if (pl.skip) continue;
        pl.phIdxs.forEach((phIdx, i) => {
          const litBefore = i === 0 ? pl.lits[0] : pl.lits[i];
          const litAfter = pl.lits[i + 1] ?? '';
          emit(pl.vals[i], phKeys[phIdx], litBefore, litAfter);
        });
      }
    } else {
      const { vals, lits } = split.joined;
      vals.forEach((v, i) => {
        const litBefore = lits[i] ?? '';
        let litAfter = lits[i + 1] ?? '';
        // if literal between placeholders is whitespace-with-newline, JSX renders nothing -> move a space into previous value
        if (i > 0 && /^\s*$/.test(litBefore) && litBefore.includes('\n')) {
          vals[i - 1] = (vals[i - 1] ?? '') + ' ';
        }
        emit(v, phKeys[i], litBefore, litAfter);
      });
    }
  }
}

/* ---------- dedupe + conflicts ---------- */
const byKey = new Map();
for (const p of pairs) {
  if (!byKey.has(p.key)) byKey.set(p.key, { values: [], files: new Set(), statuses: new Set() });
  const e = byKey.get(p.key);
  e.values.push(p.value);
  e.files.add(p.file);
  e.statuses.add(p.status);
}
const finalPairs = [];
const conflictList = [];
for (const [key, e] of byKey) {
  const uniq = [...new Set(e.values)];
  if (uniq.length > 1) {
    conflictList.push({ key, values: uniq, files: [...e.files] });
    finalPairs.push({ key, value: uniq[0], status: 'conflict', values: uniq, files: [...e.files] });
  } else {
    finalPairs.push({ key, value: uniq[0], status: e.statuses.has('ok') && e.statuses.size === 1 ? 'ok' : [...e.statuses].join(','), files: [...e.files] });
  }
}

/* ---------- write outputs ---------- */
fs.writeFileSync('d:/bruno/.i18n-work/x2-pairs.json', JSON.stringify(finalPairs, null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-used-keys.json', JSON.stringify([...usedKeys.keys()].sort(), null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-dynamic.json', JSON.stringify(dynamicLines, null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-manual.json', JSON.stringify(manualBlocks, null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-nested.json', JSON.stringify([...nestedKeys.keys()].sort(), null, 2));

console.log('total unique keys extracted:', finalPairs.length);
console.log('ok:', finalPairs.filter((p) => p.status === 'ok').length);
console.log('flagged:', finalPairs.filter((p) => p.status !== 'ok').length);
const statusCounts = {};
for (const p of finalPairs) statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
console.log(statusCounts);
console.log('manual blocks:', manualBlocks.length);
console.log('dynamic lines:', dynamicLines.length);
console.log('nested keys:', nestedKeys.size);
console.log('all used keys (incl unresolved):', usedKeys.size);
