import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import iconv from 'iconv-lite';

export type TextEncoding = 'utf-8' | 'utf-8-bom' | 'utf-16le' | 'utf-16be' | 'gb18030';

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
const BOM_UTF16LE = Buffer.from([0xff, 0xfe]);
const BOM_UTF16BE = Buffer.from([0xfe, 0xff]);

const MAX_CACHE_SIZE = 2000;

interface EncodingCacheEntry {
  encoding: TextEncoding;
  mtimeMs: number;
  size: number;
}

// Per-path encoding cache so save paths can re-encode with the file's original
// encoding without re-reading it. Entries are validated against mtime/size at
// write time; a mismatch (the file changed or was recreated externally) falls
// back to utf-8 rather than writing bytes in a possibly stale encoding.
const encodingCache = new Map<string, EncodingCacheEntry>();

function normalizePath(filePath: string): string {
  const normalized = path.normalize(filePath);
  if (process.platform === 'darwin' || process.platform === 'win32') {
    return normalized.toLowerCase();
  }
  return normalized;
}

function setCache(pathname: string, entry: EncodingCacheEntry): void {
  const key = normalizePath(pathname);
  if (!encodingCache.has(key) && encodingCache.size >= MAX_CACHE_SIZE) {
    // Simple eviction: drop the oldest inserted entry.
    encodingCache.delete(encodingCache.keys().next().value);
  }
  encodingCache.set(key, entry);
}

/**
 * Detect the text encoding of a buffer.
 * BOM checks first, then a strict UTF-8 validation; anything that is not valid
 * UTF-8 is decoded as gb18030 (a superset of GBK/GB2312).
 */
export function detectEncoding(buffer: Buffer): TextEncoding {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(BOM_UTF8)) {
    return 'utf-8-bom';
  }
  if (buffer.length >= 2 && buffer.subarray(0, 2).equals(BOM_UTF16LE)) {
    return 'utf-16le';
  }
  if (buffer.length >= 2 && buffer.subarray(0, 2).equals(BOM_UTF16BE)) {
    return 'utf-16be';
  }
  if (isValidUtf8(buffer)) {
    return 'utf-8';
  }
  return 'gb18030';
}

function isValidUtf8(buffer: Buffer): boolean {
  try {
    // fatal: true makes the decoder throw on invalid sequences, including
    // truncated multi-byte characters at the end of the buffer.
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch (_) {
    return false;
  }
}

function decodeBuffer(buffer: Buffer, encoding: TextEncoding): string {
  let content = buffer;
  if (encoding === 'utf-8-bom') {
    content = content.subarray(3);
  } else if (encoding === 'utf-16le' || encoding === 'utf-16be') {
    content = content.subarray(2);
  }
  if (encoding === 'gb18030') {
    return iconv.decode(content, 'gb18030');
  }
  if (encoding === 'utf-16le') {
    return iconv.decode(content, 'utf-16le');
  }
  if (encoding === 'utf-16be') {
    return iconv.decode(content, 'utf-16be');
  }
  return content.toString('utf8');
}

function encodeText(data: string, encoding: TextEncoding): Buffer {
  let payload: Buffer;
  switch (encoding) {
    case 'gb18030':
      payload = iconv.encode(data, 'gb18030');
      break;
    case 'utf-16le':
      payload = iconv.encode(data, 'utf-16le');
      break;
    case 'utf-16be':
      payload = iconv.encode(data, 'utf-16be');
      break;
    default:
      payload = Buffer.from(data, 'utf8');
  }
  if (encoding === 'utf-8-bom') {
    return Buffer.concat([BOM_UTF8, payload]);
  }
  if (encoding === 'utf-16le') {
    return Buffer.concat([BOM_UTF16LE, payload]);
  }
  if (encoding === 'utf-16be') {
    return Buffer.concat([BOM_UTF16BE, payload]);
  }
  return payload;
}

function cacheEntryFromStat(pathname: string, encoding: TextEncoding): EncodingCacheEntry | null {
  try {
    const stat = fs.statSync(pathname);
    return { encoding, mtimeMs: stat.mtimeMs, size: stat.size };
  } catch (_) {
    return null;
  }
}

/**
 * Look up the encoding recorded for a path. Returns 'utf-8' when there is no
 * cache entry (new file) or when the file changed on disk since it was read
 * (stale entry — safer to fall back to utf-8 than to write a wrong encoding).
 */
export function getEncodingFor(pathname: string): TextEncoding {
  const entry = encodingCache.get(normalizePath(pathname));
  if (!entry) {
    return 'utf-8';
  }
  try {
    const stat = fs.statSync(pathname);
    if (stat.mtimeMs === entry.mtimeMs && stat.size === entry.size) {
      return entry.encoding;
    }
  } catch (_) {
    // File was deleted or is not readable — fall through to the default.
  }
  encodingCache.delete(normalizePath(pathname));
  return 'utf-8';
}

export function deleteEncodingCache(pathname: string): void {
  encodingCache.delete(normalizePath(pathname));
}

export async function readTextFile(pathname: string): Promise<{ data: string; encoding: TextEncoding }> {
  const buffer = await fsp.readFile(pathname);
  const encoding = detectEncoding(buffer);
  const entry = cacheEntryFromStat(pathname, encoding);
  if (entry) {
    setCache(pathname, entry);
  }
  return { data: decodeBuffer(buffer, encoding), encoding };
}

export function readTextFileSync(pathname: string): { data: string; encoding: TextEncoding } {
  const buffer = fs.readFileSync(pathname);
  const encoding = detectEncoding(buffer);
  const entry = cacheEntryFromStat(pathname, encoding);
  if (entry) {
    setCache(pathname, entry);
  }
  return { data: decodeBuffer(buffer, encoding), encoding };
}

/**
 * Write text honoring the file's original encoding. Encoding resolution order:
 * explicit argument > cache entry (validated against mtime/size) > utf-8.
 * New files have no cache entry and are written as utf-8.
 */
export async function writeTextFile(pathname: string, data: string, encoding?: TextEncoding): Promise<void> {
  const resolved = encoding || getEncodingFor(pathname);
  const buffer = encodeText(data, resolved);
  const dir = path.dirname(pathname);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await fsp.writeFile(pathname, buffer);
  const entry = cacheEntryFromStat(pathname, resolved);
  if (entry) {
    setCache(pathname, entry);
  }
}

export function writeTextFileSync(pathname: string, data: string, encoding?: TextEncoding): void {
  const resolved = encoding || getEncodingFor(pathname);
  const buffer = encodeText(data, resolved);
  const dir = path.dirname(pathname);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(pathname, buffer);
  const entry = cacheEntryFromStat(pathname, resolved);
  if (entry) {
    setCache(pathname, entry);
  }
}
