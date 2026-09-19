const { redactLargeBruTextBlocks, restoreRedactedBlocks, DICT_REDACT_THRESHOLD } = require('../utils/redact-large-text-blocks');
const { parseBruRequest, stringifyBruRequest } = require('../index');

const toCRLF = (content) => content.replace(/\n/g, '\r\n');

const buildParamsBlock = (count, prefix = 'p') => {
  const lines = [];
  for (let i = 0; i < count; i++) {
    lines.push(`  ${prefix}${i}: value-${i}`);
  }
  return lines.join('\n');
};

const buildRequestBru = (paramsContent) => `meta {
  name: Big Params
  type: http
  seq: 1
}

get {
  url: https://example.com/api
  body: none
  auth: none
}

params:query {
${paramsContent}
}
`;

describe('redactLargeBruTextBlocks — dictionary blocks', () => {
  it('keeps small dictionary blocks in the skeleton untouched', () => {
    const content = buildRequestBru(buildParamsBlock(3));
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);

    expect(blocks.filter((block) => block.kind === 'dict')).toHaveLength(0);
    expect(skeleton).toContain('p0: value-0');
    expect(skeleton).toContain('params:query {');
  });

  it('redacts a params block above the threshold and restores it on parse', () => {
    const content = buildRequestBru(buildParamsBlock(4000));
    expect(content.length).toBeGreaterThan(DICT_REDACT_THRESHOLD);

    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    const dictBlocks = blocks.filter((block) => block.kind === 'dict');
    expect(dictBlocks).toHaveLength(1);
    expect(dictBlocks[0].tag).toBe('params:query');
    expect(dictBlocks[0].value).toContain('p0: value-0');
    // skeleton keeps the block tag and a placeholder pair
    expect(skeleton).toContain('params:query {');
    expect(skeleton).toMatch(/__BRU_REDACTED_TEXT_BLOCK_\w+__: /);

    const json = restoreRedactedBlocks(require('@usebruno/lang').bruToJsonV2(skeleton), blocks);
    expect(json.params).toHaveLength(4000);
    expect(json.params[0]).toEqual({ name: 'p0', value: 'value-0', enabled: true, type: 'query' });
    expect(json.params[3999].name).toBe('p3999');
  });

  it('preserves disabled pairs through redaction', () => {
    const params = ['  enabled-param: yes', '  ~disabled-param: no', ...Array.from({ length: 4000 }, (_, i) => `  pad${i}: v${i}`)].join('\n');
    const content = buildRequestBru(params);
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    const json = restoreRedactedBlocks(require('@usebruno/lang').bruToJsonV2(skeleton), blocks);

    expect(json.params).toHaveLength(4002);
    const disabled = json.params.find((param) => param.name === 'disabled-param');
    expect(disabled.enabled).toBe(false);
    expect(disabled.value).toBe('no');
    const enabled = json.params.find((param) => param.name === 'enabled-param');
    expect(enabled.enabled).toBe(true);
  });

  it('redacts and restores headers and form-urlencoded blocks', () => {
    const headerLines = Array.from({ length: 4000 }, (_, i) => `  x-hdr-${i}: v-${i}`).join('\n');
    const formLines = Array.from({ length: 4000 }, (_, i) => `  field${i}: v-${i}`).join('\n');
    const content = `meta {
  name: Big Headers
  type: http
}

post {
  url: https://example.com/api
  body: form-url-encoded
}

headers {
${headerLines}
}

body:form-urlencoded {
${formLines}
}
`;
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    expect(blocks.filter((block) => block.kind === 'dict')).toHaveLength(2);

    const json = restoreRedactedBlocks(require('@usebruno/lang').bruToJsonV2(skeleton), blocks);
    expect(json.headers).toHaveLength(4000);
    expect(json.headers[0]).toEqual({ name: 'x-hdr-0', value: 'v-0', enabled: true });
    expect(json.body.formUrlEncoded).toHaveLength(4000);
    expect(json.body.formUrlEncoded[999].name).toBe('field999');
  });

  it('redacts and restores multipart-form blocks with @file pairs', () => {
    const lines = ['  text-field: hello', ...Array.from({ length: 4000 }, (_, i) => `  file${i}: @file(/tmp/f${i}.bin)`)].join('\n');
    const content = `meta {
  name: Big Multipart
  type: http
}

post {
  url: https://example.com/api
  body: multipart-form
}

body:multipart-form {
${lines}
}
`;
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    const json = restoreRedactedBlocks(require('@usebruno/lang').bruToJsonV2(skeleton), blocks);

    expect(json.body.multipartForm).toHaveLength(4001);
    expect(json.body.multipartForm[0]).toEqual({ name: 'text-field', value: 'hello', type: 'text', contentType: '', enabled: true });
    const filePair = json.body.multipartForm.find((pair) => pair.name === 'file0');
    expect(filePair.type).toBe('file');
    expect(filePair.value).toEqual(['/tmp/f0.bin']);
  });

  it('handles CRLF line endings', () => {
    const content = toCRLF(buildRequestBru(buildParamsBlock(4000)));
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    expect(blocks.filter((block) => block.kind === 'dict')).toHaveLength(1);

    const json = restoreRedactedBlocks(require('@usebruno/lang').bruToJsonV2(skeleton), blocks);
    expect(json.params).toHaveLength(4000);
    expect(json.params[0].value).toBe('value-0');
  });

  it('skips redaction entirely on token collision', () => {
    const content = buildRequestBru(buildParamsBlock(4000));
    const { skeleton: withToken } = redactLargeBruTextBlocks(content);
    const token = withToken.match(/__BRU_REDACTED_TEXT_BLOCK_\w+__/)[0];

    // a file already containing the token must not be redacted
    const hostile = buildRequestBru(buildParamsBlock(4000)).replace('p0: value-0', token + ': x');
    const { skeleton, blocks } = redactLargeBruTextBlocks(hostile);
    expect(blocks).toHaveLength(0);
    expect(skeleton).toBe(hostile);
    expect(hostile).toContain(token);
  });

  it('leaves an unterminated dictionary block unredacted', () => {
    const content = buildRequestBru(buildParamsBlock(4000)).replace(/\}\s*$/, '');
    const { skeleton, blocks } = redactLargeBruTextBlocks(content);
    expect(blocks.filter((block) => block.kind === 'dict')).toHaveLength(0);
    expect(skeleton).toContain('p0: value-0');
  });
});

describe('parseBruRequest — large request auto-redaction', () => {
  it('parses a params-heavy file above 512KB correctly', () => {
    const content = buildRequestBru(buildParamsBlock(30000));
    expect(content.length).toBeGreaterThan(512 * 1024);

    const parsed = parseBruRequest(content);
    expect(parsed.request.params).toHaveLength(30000);
    expect(parsed.request.params[0]).toEqual({ name: 'p0', value: 'value-0', enabled: true, type: 'query' });
    expect(parsed.name).toBe('Big Params');
    expect(parsed.request.method).toBe('GET');
  });

  it('round-trips a params-heavy file without data loss', () => {
    const content = buildRequestBru(buildParamsBlock(30000));
    const parsed = parseBruRequest(content);
    const stringified = stringifyBruRequest(parsed);
    const reparsed = parseBruRequest(stringified);

    expect(reparsed.request.params).toHaveLength(30000);
    expect(reparsed.request.params).toEqual(parsed.request.params);
  });

  it('does not change behavior for small files', () => {
    const content = buildRequestBru(buildParamsBlock(3));
    const parsed = parseBruRequest(content);
    expect(parsed.request.params).toHaveLength(3);
    expect(parsed.request.params[2]).toEqual({ name: 'p2', value: 'value-2', enabled: true, type: 'query' });
  });

  it('still redacts large body blocks in a large file', () => {
    const bigBody = JSON.stringify({ data: Array.from({ length: 20000 }, (_, i) => ({ index: i, payload: 'x'.repeat(20) })) }, null, 2)
      .split('\n')
      .map((line) => (line ? `  ${line}` : line))
      .join('\n');
    const content = `meta {
  name: Big Body
  type: http
}

post {
  url: https://example.com/api
  body: json
}

body:json {
${bigBody}
}
`;
    const parsed = parseBruRequest(content);
    expect(parsed.request.body.mode).toBe('json');
    expect(JSON.parse(parsed.request.body.json).data).toHaveLength(20000);
  });
});
