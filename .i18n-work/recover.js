const fs = require('fs');

const ROOT = 'd:/bruno';
const DIFF = fs.readFileSync(ROOT + '/.i18n-work/sidebar.diff', 'utf8').replace(/^\uFEFF/, '');

// marker format: \x01{id}:{key}\x02  (pure ASCII sentinels)
const MARKER_G = /\x01(\d+):([^\x02]*)\x02/g;

// ---------------- parse diff into per-file blocks ----------------
const files = [];
let cur = null;
let inHunk = false;
for (const L of DIFF.split(/\r?\n/)) {
  if (L.startsWith('diff --git ')) {
    const m = L.match(/ b\/(.+)$/);
    cur = { file: m[1], blocks: [] };
    files.push(cur);
    inHunk = false;
    continue;
  }
  if (!cur) continue;
  if (L.startsWith('@@')) {
    inHunk = true;
    cur.blocks.push({ old: [], added: [] });
    continue;
  }
  if (!inHunk) continue;
  const blk = cur.blocks[cur.blocks.length - 1];
  if (L.startsWith('-')) { blk.old.push(L.slice(1)); }
  else if (L.startsWith('+')) { blk.added.push(L.slice(1)); }
  else if (L.startsWith(' ') || L === '') {
    if (blk.old.length || blk.added.length) cur.blocks.push({ old: [], added: [] });
  }
}

// ---------------- t-call masking (full span, recursive) ----------------
let NEXT_ID = 0;
function maskLine(line) {
  // replaces every outermost sidebar t-call span (incl. args) with \x01id:key\x02;
  // nested sidebar calls inside args are masked first and recorded in metas
  const metas = new Map();
  const re = /(?:i18n\.)?\bt\(\s*'(sidebar\.[^']*)'/g;
  let out = '';
  let last = 0;
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index < last) continue; // inside previous span
    const openIdx = m.index + m[0].indexOf('(');
    const closeIdx = findMatchingParen(line, openIdx);
    if (closeIdx === -1) {
      // multi-line call: mask head only, keep args visible for alignment
      const id = NEXT_ID++;
      metas.set(id, { key: m[1], params: [] });
      out += line.slice(last, m.index) + '\x01' + id + ':' + m[1] + '\x02';
      last = m.index + m[0].length;
      re.lastIndex = m.index + m[0].length;
      continue;
    }
    let args = line.slice(openIdx + 1, closeIdx);
    const nested = maskLine(args);
    for (const [k, v] of nested.metas) metas.set(k, v);
    args = nested.text;
    const params = parseParams(args);
    const id = NEXT_ID++;
    metas.set(id, { key: m[1], params });
    out += line.slice(last, m.index) + '\x01' + id + ':' + m[1] + '\x02';
    last = closeIdx + 1;
    re.lastIndex = closeIdx + 1;
  }
  out += line.slice(last);
  return { text: out, metas };
}

function findMatchingParen(s, openIdx) {
  let depth = 0, q = null;
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '\\') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function splitTopLevel(s, sep) {
  const parts = [];
  let depth = 0, q = null, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === sep && depth === 0) { parts.push(s.slice(last, i)); last = i + 1; }
  }
  parts.push(s.slice(last));
  return parts;
}

function parseParams(argsText) {
  const parts = splitTopLevel(argsText, ',');
  if (parts.length < 2) return [];
  const obj = parts.slice(1).join(',').trim();
  const m = obj.match(/^\{([\s\S]*)\}$/);
  if (!m) return [];
  const params = [];
  for (let part of splitTopLevel(m[1], ',')) {
    part = part.trim();
    if (!part) continue;
    const kv = part.match(/^(\w+)\s*:\s*([\s\S]+)$/);
    if (kv) params.push({ name: kv[1], value: kv[2].trim() });
    else params.push({ name: part, value: part });
  }
  return params;
}

function splitTrailingLiterals(expr) {
  const lits = [];
  let c = expr, m;
  while ((m = c.match(/(^|\|\||\+|&&)\s*(['"`])([^'"`]*)\2\s*$/))) {
    lits.unshift(m[3]);
    c = c.slice(0, m.index) + m[1];
  }
  return { remainder: c.trim(), lits };
}

// ---------------- tokenize for block alignment ----------------
const TOKEN_RE = new RegExp('\\{\x01[^\\x02]*\\x02\\}|\x01[^\\x02]*\\x02|\'[^\'\\n]*\'|"[^"\\n]*"|`[^`]*`|\\{[^{}\\n]*\\}|\\s+|[^\\s\'"`{}\\x01]+|.', 'g');

function tokenize(text) {
  const toks = [];
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    toks.push({ text: m[0], start: m.index, end: m.index + m[0].length, ws: /^\s+$/.test(m[0]) });
  }
  return toks;
}

function alignBlock(oldText, newText) {
  const A = tokenize(oldText), B = tokenize(newText);
  const norm = (t) => (t.ws ? ' ' : t.text);
  const n = A.length, m = B.length;
  const dp = new Uint32Array((n + 1) * (m + 1));
  const W = m + 1;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * W + j] = norm(A[i]) === norm(B[j]) ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const gaps = [];
  let i = 0, j = 0, lastOld = 0, lastNew = 0;
  const pushGap = (oe, ne) => {
    if (oe > lastOld || ne > lastNew) gaps.push({ oldPiece: oldText.slice(lastOld, oe), newPiece: newText.slice(lastNew, ne) });
  };
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) {
      pushGap(A[i].start, B[j].start);
      lastOld = A[i].end; lastNew = B[j].end;
      i++; j++;
    } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
    else j++;
  }
  pushGap(oldText.length, newText.length);
  return gaps;
}

// ---------------- normalization of old pieces ----------------
function lookupParam(expr, params, keyInfo) {
  expr = expr.trim();
  const exact = params.find((p) => p.value === expr);
  if (exact) return { name: exact.name, innerKeys: [], lits: [], ok: true };
  const { remainder, lits } = splitTrailingLiterals(expr);
  for (const p of params) {
    const skeleton = p.value.replace(/\x01[^\x02]*\x02/g, '').trim();
    if (skeleton && (skeleton === remainder || p.value === remainder)) {
      const innerKeys = [];
      let mm;
      MARKER_G.lastIndex = 0;
      while ((mm = MARKER_G.exec(p.value)) !== null) innerKeys.push(mm[2]);
      return { name: p.name, innerKeys, lits, ok: true };
    }
  }
  const pw = expr.match(/pluralizeWord\(\s*'([^']+)'/);
  if (pw) { keyInfo.flags.push('pluralize-fallback'); return { name: null, fallback: pw[1] + 's', innerKeys: [], lits: [], ok: false }; }
  const ids = expr.match(/[A-Za-z_$][\w$]*/g);
  const fb = ids ? ids[ids.length - 1] : expr;
  keyInfo.flags.push('param-fallback:' + fb);
  return { name: null, fallback: fb, innerKeys: [], lits: [], ok: false };
}

function unescapeStr(s) {
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\`/g, '`').replace(/\\\\/g, '\\');
}

function convertEntities(s) {
  return s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function isWrappedContainer(s) {
  // true if s = { ... } where the first { closes exactly at the last char
  if (!s.startsWith('{') || !s.endsWith('}')) return false;
  let depth = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i === s.length - 1; }
  }
  return false;
}

function normalizePiece(raw, params, keyInfo) {
  let s = raw.trim();
  // strip wrapping JSX expression container(s)
  while (isWrappedContainer(s)) s = s.slice(1, -1).trim();
  // junk-tolerant: leading ${ or backtick/paren fragments from partial matches
  s = s.replace(/^[`\s]*\$\{/, '');
  s = s.replace(/^[`\s]+/, '');
  if (!s) return { text: '', inner: [] };

  // template literal (optional trailing junk: ` ) ; , )
  let tm = s.match(/^`([\s\S]*)`[\s);,]*$/) || s.match(/^`([\s\S]*)$/);
  if (tm) {
    const inner = [];
    const out = tm[1].replace(/\$\{([^}]*)\}/g, (_, expr) => {
      const r = lookupParam(expr, params, keyInfo);
      if (r.innerKeys && r.innerKeys.length) {
        const pool = r.lits.slice();
        for (const ik of r.innerKeys) inner.push({ key: ik, literal: pool.length ? pool.shift() : null });
        if (pool.length) keyInfo.flags.push('lits-leftover');
      }
      return '{{' + (r.name || r.fallback || 'value') + '}}';
    });
    return { text: convertEntities(unescapeStr(out)), inner };
  }
  // quoted string (optional trailing junk)
  const qm = s.match(/^'([\s\S]*)'[\s),;]*$/) || s.match(/^"([\s\S]*)"[\s),;]*$/);
  if (qm) return { text: convertEntities(unescapeStr(qm[1])), inner: [] };
  if (s.includes('+')) {
    const parts = splitTopLevel(s, '+').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      let okAll = true;
      const out = parts.map((p) => {
        const q = p.match(/^'([\s\S]*)'[\s),;]*$/) || p.match(/^"([\s\S]*)"[\s),;]*$/);
        if (q) return unescapeStr(q[1]);
        const r = lookupParam(p, params, keyInfo);
        if (!r.ok) okAll = false;
        return '{{' + (r.name || r.fallback) + '}}';
      }).join('');
      return { text: convertEntities(out), inner: [], ok: okAll };
    }
  }
  // plain JSX text: strip tag markup, convert {expr} children
  let missing = false;
  const stripped = s.replace(/<[^<>]*>/g, '').replace(/\s+/g, ' ');
  const out = stripped.replace(/\{([^{}]+)\}/g, (_, expr) => {
    const r = lookupParam(expr, params, keyInfo);
    if (!r.ok) missing = true;
    return '{{' + (r.name || r.fallback) + '}}';
  });
  return { text: convertEntities(unescapeStr(out.trim())), inner: [], ok: !missing };
}

// ---------------- main ----------------
const results = new Map();
function record(key, entry) {
  if (!results.has(key)) results.set(key, []);
  results.get(key).push(entry);
}

let blockCount = 0, markedBlocks = 0;
for (const f of files) {
  for (const blk of f.blocks) {
    if (!blk.old.length && !blk.added.length) continue;
    blockCount++;
    const addedText = blk.added.join('\n');
    if (!/\bt\(\s*'(sidebar\.)/.test(addedText)) continue;
    markedBlocks++;
    const oldText = blk.old.join('\n');

    const markerMeta = new Map();
    const newLines = blk.added.map((line) => {
      const r = maskLine(line);
      for (const [k, v] of r.metas) markerMeta.set(k, v);
      return r.text;
    });

    const newText = newLines.join('\n');
    if ((oldText.length + 1) * (newText.length + 1) > 8000000) { record('@@TOO_BIG@@', { file: f.file, flags: ['too-big'], original: null, params: '' }); continue; }
    const gaps = alignBlock(oldText, newText);
    for (const gap of gaps) {
      const markerIds = [];
      let mm;
      MARKER_G.lastIndex = 0;
      while ((mm = MARKER_G.exec(gap.newPiece)) !== null) markerIds.push({ id: +mm[1], key: mm[2] });
      if (!markerIds.length) continue;
      if (markerIds.length > 1) {
        markerIds.forEach((mk, idx) => {
          const meta = markerMeta.get(mk.id);
          const keyInfo = { flags: ['multi-marker-piece'] };
          const res = idx === 0 ? normalizePiece(gap.oldPiece, meta.params, keyInfo) : { text: null, inner: [] };
          record(mk.key, { original: res.text, file: f.file, params: meta.params.map((p) => p.name).join(','), flags: keyInfo.flags, raw: gap.oldPiece.slice(0, 200) });
          if (res.inner) {
            for (const ik of res.inner) {
              if (ik.literal == null) record(ik.key, { original: null, file: f.file, params: '', flags: ['inner-key-no-literal'], raw: gap.oldPiece.slice(0, 150) });
              else record(ik.key, { original: ik.literal, file: f.file, params: '', flags: ['inner-key'], raw: '' });
            }
          }
        });
        continue;
      }
      const meta = markerMeta.get(markerIds[0].id);
      const keyInfo = { flags: [] };
      const res = normalizePiece(gap.oldPiece, meta.params, keyInfo);
      const entry = { original: res.text, file: f.file, params: meta.params.map((p) => p.name).join(','), flags: keyInfo.flags.slice(), raw: gap.oldPiece.slice(0, 200) };
      if (res.ok === false) entry.flags.push('normalize-missing-param');
      record(meta.key, entry);
      if (res.inner) {
        for (const ik of res.inner) {
          if (ik.literal == null) record(ik.key, { original: null, file: f.file, params: '', flags: ['inner-key-no-literal'], raw: gap.oldPiece.slice(0, 150) });
          else record(ik.key, { original: ik.literal, file: f.file, params: '', flags: ['inner-key'], raw: '' });
        }
      }
    }
  }
}

// ---------------- consolidate + report ----------------
const finals = new Map();
const anomalies = [];
for (const [key, entries] of [...results.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const nonNull = entries.filter((e) => e.original != null && e.original !== '');
  const variants = [...new Set(nonNull.map((e) => e.original))];
  const chosen = variants[0] || null;
  const flags = new Set();
  entries.forEach((e) => e.flags.forEach((fl) => flags.add(fl)));
  const paramNames = entries.map((e) => e.params).find((p) => p) || '';
  if (!chosen) flags.add('no-original');
  if (variants.length > 1) flags.add('conflict:' + variants.length);
  if (chosen && (chosen.includes('${') || chosen.includes('\x01'))) flags.add('unresolved-marker');
  if (chosen) {
    const phs = [...new Set([...chosen.matchAll(/\{\{([^}]+)\}\}/g)].map((x) => x[1].trim()))];
    const pn = paramNames ? paramNames.split(',') : [];
    for (const ph of phs) if (pn.length && !pn.includes(ph)) flags.add('placeholder-not-in-params:' + ph);
    if (pn.length && !phs.length) flags.add('params-but-no-placeholder');
    if (!pn.length && phs.length) flags.add('placeholder-but-no-params');
  }
  finals.set(key, { original: chosen, flags: [...flags], variants, params: paramNames, files: [...new Set(entries.map((e) => e.file))] });
  if (flags.size) anomalies.push(key);
}

const scanOut = fs.readFileSync(ROOT + '/.i18n-work/keys.txt', 'utf8');
const scanned = new Set();
for (const L of scanOut.split(/\r?\n/)) {
  const m = L.match(/^(sidebar\.[^\s]+) /);
  if (m) scanned.add(m[1]);
}
const recovered = new Set(finals.keys());
const missingFromDiff = [...scanned].filter((k) => !recovered.has(k)).sort();
const extraInDiff = [...recovered].filter((k) => !scanned.has(k)).sort();

const summary = { blocks: blockCount, markedBlocks, keysRecovered: finals.size, keysScanned: scanned.size, flagged: anomalies.length, missingFromDiff, extraInDiff };
fs.writeFileSync(ROOT + '/.i18n-work/recovered.json', JSON.stringify({ summary, finals: Object.fromEntries(finals) }, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log('--- flagged keys ---');
for (const k of anomalies) {
  const e = finals.get(k);
  console.log(k, '|', JSON.stringify(e.original), '|', e.flags.join(','), '|', e.variants.length + 'v', '|', e.files[0]);
}
