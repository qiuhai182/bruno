import { createHash } from 'node:crypto';
import { outdentString, bruToJsonV2 } from '@usebruno/lang';

export interface RedactedBlock {
  token: string;
  value: string;
  // 'text' blocks (body/scripts/docs) are restored by replacing the token string;
  // 'dict' blocks (params/headers/etc.) are restored by re-parsing the block and
  // splicing the resulting pair list in place of the placeholder pair.
  kind?: 'text' | 'dict';
  tag?: string;
}

export interface RedactionResult {
  skeleton: string;
  blocks: RedactedBlock[];
}

// Dictionary blocks larger than this are replaced with a placeholder pair before
// parsing. ohm-js memoization consumes memory roughly linear in input size times a
// large constant (~hundreds of MB per MB of input), so a params-heavy request file
// can exhaust the heap. Redacting the block keeps the skeleton small.
export const DICT_REDACT_THRESHOLD = 64 * 1024;

const TEXT_BLOCK_TAGS = [
  'body:graphql:vars',
  'body:graphql',
  'body:json',
  'body:text',
  'body:xml',
  'body:sparql',
  'script:pre-request',
  'script:post-response',
  'script:grpc:before-call-start',
  'script:grpc:before-message-send',
  'script:grpc:after-message-receive',
  'script:grpc:after-call-end',
  'tests',
  'docs',
  'body'
];

// Dictionary (key-value pair list) blocks that can grow unbounded with request size.
// meta/app/settings/grpc/ws are excluded on purpose: they are small and some
// consumers rely on them being present in the skeleton.
const DICT_BLOCK_TAGS = [
  'params:path',
  'params:query',
  'query',
  'headers',
  'metadata',
  'body:form-urlencoded',
  'body:multipart-form',
  'body:file',
  'vars:pre-request',
  'vars:post-response',
  'assert'
];

const TEXT_BLOCK_OPENING = new RegExp(`^(${TEXT_BLOCK_TAGS.join('|')})[ \\t]*\\{\\r?$`);
const DICT_BLOCK_OPENING = new RegExp(`^(${DICT_BLOCK_TAGS.join('|')})[ \\t]*\\{\\r?$`);

const isOpening = (line: string): boolean => TEXT_BLOCK_OPENING.test(line);
const isDictOpening = (line: string): boolean => DICT_BLOCK_OPENING.test(line);

// A top-level block's closing brace sits at column 0; braces inside the content are indented, so
// nested braces are correctly treated as content rather than ending the block early.
const isClosing = (line: string): boolean => line.startsWith('}');

const tokenFor = (content: string): string => {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
  return `__BRU_REDACTED_TEXT_BLOCK_${hash}__`;
};

const blockValue = (content: string[]): string =>
  outdentString(content.join('\n').replace(/^(?:\r?\n)+/, '').replace(/\r$/, ''));

const APP_BLOCK_OPENING = /^app[ \t]*\{\r?$/;
const MULTILINE_DELIMITER = '\'\'\'';
const APP_CODE_PAIR = `code: ${MULTILINE_DELIMITER}`;

const appCodeValue = (code: string[]): string =>
  code.map((line) => line.slice(4)).join('\n').trim();

const redactAppCode = (source: string, blocks: RedactedBlock[]): string => {
  const lines = source.split('\n');

  const start = lines.findIndex((line) => APP_BLOCK_OPENING.test(line));
  if (start === -1) {
    return source;
  }

  const closingBrace = lines.findIndex((line, index) => index > start && isClosing(line));
  const end = closingBrace === -1 ? lines.length : closingBrace;

  const opening = lines.findIndex((line, index) => index > start && index < end && line.trim() === APP_CODE_PAIR);
  if (opening === -1) {
    return source;
  }

  const closing = lines.findIndex(
    (line, index) => index > opening && index < end && line.trim() === MULTILINE_DELIMITER
  );
  if (closing === -1) {
    return source;
  }

  const code = lines.slice(opening + 1, closing);
  const value = appCodeValue(code);
  if (!value.length) {
    return source;
  }

  const token = tokenFor(code.join('\n'));
  blocks.push({ token, value, kind: 'text' });
  return [...lines.slice(0, opening + 1), `    ${token}`, ...lines.slice(closing)].join('\n');
};

export const redactLargeBruTextBlocks = (content: string): RedactionResult => {
  const source = content || '';
  const skeleton: string[] = [];
  const blocks: RedactedBlock[] = [];

  let openTag: string | null = null;
  let openContent: string[] = [];

  let openDictTag: string | null = null;
  let openDictLine: string | null = null;
  let openDictContent: string[] = [];

  for (const line of redactAppCode(source, blocks).split('\n')) {
    if (openTag !== null) {
      // inside a text block
      if (isClosing(line)) {
        const token = tokenFor(openContent.join('\n'));
        blocks.push({ token, value: blockValue(openContent), kind: 'text' });
        skeleton.push(openTag, `  ${token}`, line);
        openTag = null;
        continue;
      }
      openContent.push(line);
      continue;
    }

    if (openDictLine !== null) {
      // inside a dictionary block
      if (isClosing(line)) {
        const raw = openDictContent.join('\n');
        if (raw.length > DICT_REDACT_THRESHOLD) {
          const token = tokenFor(raw);
          blocks.push({ token, value: raw, kind: 'dict', tag: openDictTag ?? '' });
          // the placeholder must parse as a pair: "token: <empty>"
          skeleton.push(openDictLine, `  ${token}: `, line);
        } else {
          skeleton.push(openDictLine, ...openDictContent, line);
        }
        openDictTag = null;
        openDictLine = null;
        continue;
      }
      openDictContent.push(line);
      continue;
    }

    if (isOpening(line)) {
      openTag = line;
      openContent = [];
      continue;
    }

    if (isDictOpening(line)) {
      const dictMatch = DICT_BLOCK_OPENING.exec(line);
      openDictTag = dictMatch?.[1] ?? line;
      openDictLine = line;
      openDictContent = [];
      continue;
    }

    skeleton.push(line);
  }

  if (openTag !== null) {
    skeleton.push(openTag, ...openContent);
  }

  if (openDictLine !== null) {
    skeleton.push(openDictLine, ...openDictContent);
  }

  if (source.includes('__BRU_REDACTED_TEXT_BLOCK_')) {
    // A file already carrying any token-shaped string could round-trip incorrectly,
    // so skip redaction entirely and let the plain parser handle it.
    console.warn('[bruno-filestore] Token collision detected; skipping redaction');
    return { skeleton: source, blocks: [] };
  }

  return { skeleton: skeleton.join('\n'), blocks };
};

// Re-parses a redacted dictionary block standalone and returns its pair list.
// For `params:query`/`headers`/... the parse result maps the tag to an array
// directly; for `body:form-urlencoded`/`body:multipart-form`/`body:file` the
// array sits one level below the `body` key.
//
// The block content is parsed in line-aligned chunks: ohm-js memory usage grows
// steeply with input size, so re-parsing a multi-megabyte block in one shot would
// reintroduce the heap exhaustion this redaction exists to avoid. Chunk boundaries
// never split a pair — multiline `'''` values and multi-line list values defer the
// flush until they are closed.
const DICT_RESTORE_CHUNK_SIZE = 64 * 1024;

const extractItemsFromParse = (parsed: any): any[] => {
  const first = parsed && typeof parsed === 'object' ? Object.values(parsed)[0] : undefined;
  if (Array.isArray(first)) {
    return first;
  }
  if (first && typeof first === 'object') {
    const items = Object.values(first).find(Array.isArray);
    if (Array.isArray(items)) {
      return items;
    }
  }
  return [];
};

const parseDictBlockItems = (block: RedactedBlock): any[] => {
  try {
    const lines = block.value.split('\n');
    const items: any[] = [];
    let chunk: string[] = [];
    let chunkLength = 0;
    let inMultiline = false;
    let inList = false;

    const flush = () => {
      if (!chunk.length) {
        return;
      }
      const parsed = bruToJsonV2(`${block.tag} {\n${chunk.join('\n')}\n}`);
      items.push(...extractItemsFromParse(parsed));
      chunk = [];
      chunkLength = 0;
    };

    for (const line of lines) {
      chunk.push(line);
      chunkLength += line.length + 1;

      const trimmed = line.trim();
      if (!inList && (trimmed.match(/'''/g)?.length ?? 0) % 2 === 1) {
        inMultiline = !inMultiline;
      }
      if (!inMultiline) {
        if (!inList && trimmed.endsWith('[')) {
          inList = true;
        } else if (inList && (trimmed.startsWith(']') || trimmed.endsWith(']'))) {
          inList = false;
        }
      }

      if (!inMultiline && !inList && chunkLength >= DICT_RESTORE_CHUNK_SIZE) {
        flush();
      }
    }

    flush();
    return items;
  } catch (error) {
    console.warn('[bruno-filestore] Failed to restore redacted dictionary block:', error);
    return [];
  }
};

export const restoreRedactedBlocks = <T>(parsed: T, blocks: RedactedBlock[]): T => {
  if (!blocks.length) {
    return parsed;
  }

  const valueByToken = new Map(
    blocks.filter((block) => block.kind !== 'dict').map((block) => [block.token, block.value])
  );

  const dictItemsByToken = new Map<string, any[]>();
  for (const block of blocks) {
    if (block.kind === 'dict') {
      dictItemsByToken.set(block.token, parseDictBlockItems(block));
    }
  }

  const walk = (node: any): any => {
    if (typeof node === 'string') {
      return valueByToken.get(node) ?? node;
    }
    if (Array.isArray(node)) {
      const result: any[] = [];
      for (const item of node) {
        const restoredItems = item && typeof item === 'object' && !Array.isArray(item) && typeof item.name === 'string'
          ? dictItemsByToken.get(item.name)
          : undefined;
        if (restoredItems) {
          // placeholder pair -> real pair list
          for (const restored of restoredItems) {
            result.push(walk(restored));
          }
        } else {
          result.push(walk(item));
        }
      }
      return result;
    }
    if (node && typeof node === 'object') {
      for (const key of Object.keys(node)) {
        node[key] = walk(node[key]);
      }
    }
    return node;
  };

  return walk(parsed);
};
