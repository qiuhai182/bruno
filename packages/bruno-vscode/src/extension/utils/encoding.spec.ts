import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import iconv from 'iconv-lite';
import {
  detectEncoding,
  readTextFile,
  readTextFileSync,
  writeTextFile,
  getEncodingFor
} from './encoding';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-encoding-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const SAMPLE = 'hello 中文 请求\n';

describe('detectEncoding', () => {
  test('detects utf-8 BOM', () => {
    expect(detectEncoding(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(SAMPLE)]))).toBe('utf-8-bom');
  });

  test('detects utf-16le BOM', () => {
    expect(detectEncoding(Buffer.concat([Buffer.from([0xff, 0xfe]), iconv.encode(SAMPLE, 'utf-16le')]))).toBe('utf-16le');
  });

  test('detects utf-16be BOM', () => {
    expect(detectEncoding(Buffer.concat([Buffer.from([0xfe, 0xff]), iconv.encode(SAMPLE, 'utf-16be')]))).toBe('utf-16be');
  });

  test('detects pure ASCII as utf-8', () => {
    expect(detectEncoding(Buffer.from('plain ascii request'))).toBe('utf-8');
  });

  test('detects valid utf-8 multibyte content as utf-8', () => {
    expect(detectEncoding(Buffer.from(SAMPLE, 'utf8'))).toBe('utf-8');
  });

  test('detects GBK bytes as gb18030', () => {
    // 0xD6 0xD0 is the GBK encoding of '中'
    expect(detectEncoding(Buffer.from([0xd6, 0xd0]))).toBe('gb18030');
  });

  test('detects truncated utf-8 sequence as gb18030', () => {
    // 0xE4 0xB8 is an incomplete 3-byte utf-8 sequence
    expect(detectEncoding(Buffer.from([0xe4, 0xb8]))).toBe('gb18030');
  });
});

describe('read/write roundtrip', () => {
  const encodings = ['utf-8', 'utf-8-bom', 'utf-16le', 'utf-16be', 'gb18030'] as const;

  encodings.forEach((encoding) => {
    test(`roundtrips ${encoding} byte-for-byte`, async () => {
      const pathname = path.join(tmpDir, `sample-${encoding}.bru`);
      await writeTextFile(pathname, SAMPLE, encoding);

      const onDisk = fs.readFileSync(pathname);
      // iconv.encode never emits a BOM; the util prepends one for
      // utf-8-bom / utf-16le / utf-16be.
      const body = iconv.encode(SAMPLE, encoding === 'utf-8-bom' ? 'utf-8' : encoding);
      const bom = encoding === 'utf-8-bom' ? Buffer.from([0xef, 0xbb, 0xbf])
        : encoding === 'utf-16le' ? Buffer.from([0xff, 0xfe])
        : encoding === 'utf-16be' ? Buffer.from([0xfe, 0xff])
        : Buffer.alloc(0);
      expect(onDisk.equals(Buffer.concat([bom, body]))).toBe(true);

      const { data, encoding: detected } = await readTextFile(pathname);
      expect(data).toBe(SAMPLE);
      expect(detected).toBe(encoding);
    });
  });

  test('readTextFileSync strips BOM and reports encoding', () => {
    const pathname = path.join(tmpDir, 'sync.bru');
    fs.writeFileSync(pathname, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(SAMPLE)]));
    const { data, encoding } = readTextFileSync(pathname);
    expect(data).toBe(SAMPLE);
    expect(encoding).toBe('utf-8-bom');
  });
});

describe('getEncodingFor', () => {
  test('returns utf-8 for unknown (new) files', () => {
    expect(getEncodingFor(path.join(tmpDir, 'never-seen.bru'))).toBe('utf-8');
  });

  test('returns cached encoding for an unchanged file', async () => {
    const pathname = path.join(tmpDir, 'cached.bru');
    await writeTextFile(pathname, SAMPLE, 'gb18030');
    expect(getEncodingFor(pathname)).toBe('gb18030');
  });

  test('falls back to utf-8 when the file changed externally', async () => {
    const pathname = path.join(tmpDir, 'stale.bru');
    await writeTextFile(pathname, SAMPLE, 'gb18030');
    // Simulate an external rewrite (different content, fresh mtime).
    fs.writeFileSync(pathname, Buffer.from('rewritten externally'));
    expect(getEncodingFor(pathname)).toBe('utf-8');
  });
});
