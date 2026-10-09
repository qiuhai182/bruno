#!/usr/bin/env node
/**
 * Repairs .cjs files that were saved with GBK (ANSI codepage) bytes instead of UTF-8.
 * Decodes each file's bytes with TextDecoder('gbk') and rewrites as UTF-8.
 * Aborts if the decoded text still contains U+FFFD (unmappable char = data loss).
 * Pure ASCII source - safe to create via any channel.
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const targets = [
  { file: 'apply-zh-updates.cjs', patch: true },
  { file: 'spotcheck-zh.cjs', patch: false },
  { file: 'verify-zh-groups.cjs', patch: false }
];

// patch: make apply re-set addition values even if the key already exists
// (first run already inserted the keys, but with corrupted values)
const PATCH_FROM = 'if (!(nk in next)) { next[nk] = nv; added++; }';
const PATCH_TO = 'next[nk] = nv; added++;';

let failed = false;
for (const { file, patch } of targets) {
  const p = path.join(dir, file);
  const buf = fs.readFileSync(p);
  const decoded = new TextDecoder('gbk').decode(buf);
  if (decoded.includes('\uFFFD')) {
    console.log('SKIP (unmappable bytes, would lose data): ' + file);
    failed = true;
    continue;
  }
  let out = decoded;
  if (patch) {
    if (!out.includes(PATCH_FROM)) {
      console.log('SKIP (patch anchor not found): ' + file);
      failed = true;
      continue;
    }
    out = out.replace(PATCH_FROM, PATCH_TO);
  }
  fs.writeFileSync(p, out, 'utf8');
  console.log('FIXED (gbk -> utf8' + (patch ? ' + patch' : '') + '): ' + file);
}
process.exit(failed ? 1 : 0);
