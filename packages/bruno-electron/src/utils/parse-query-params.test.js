const { parseQueryParamsPreservingPlus, encodeQueryPlusSigns } = require('./parse-query-params');

describe('parseQueryParamsPreservingPlus', () => {
  it('keeps literal plus signs as plus signs', () => {
    expect(parseQueryParamsPreservingPlus('sign=a+b+c')).toEqual({ sign: 'a+b+c' });
  });

  it('still decodes percent escapes', () => {
    expect(parseQueryParamsPreservingPlus('sign=ab%2Bcd%20ef')).toEqual({ sign: 'ab+cd ef' });
  });

  it('parses plain keys and values', () => {
    expect(parseQueryParamsPreservingPlus('a=1&b=two&c')).toEqual({ a: '1', b: 'two', c: '' });
  });

  it('collects repeated keys into arrays', () => {
    expect(parseQueryParamsPreservingPlus('tag=x&tag=y')).toEqual({ tag: ['x', 'y'] });
  });

  it('keeps malformed percent escapes as-is', () => {
    expect(parseQueryParamsPreservingPlus('a=100%')).toEqual({ a: '100%' });
  });

  it('returns an empty object for empty or non-string input', () => {
    expect(parseQueryParamsPreservingPlus('')).toEqual({});
    expect(parseQueryParamsPreservingPlus(null)).toEqual({});
    expect(parseQueryParamsPreservingPlus(undefined)).toEqual({});
    expect(parseQueryParamsPreservingPlus(123)).toEqual({});
  });

  it('ignores empty pairs and keys', () => {
    expect(parseQueryParamsPreservingPlus('&&a=1&=2')).toEqual({ a: '1' });
  });

  it('decodes keys as well as values', () => {
    expect(parseQueryParamsPreservingPlus('na%2Bme=v%2B1')).toEqual({ 'na+me': 'v+1' });
  });
});

describe('encodeQueryPlusSigns', () => {
  it('encodes literal plus signs in the query as %2B', () => {
    expect(encodeQueryPlusSigns('http://api.test/x?sign=ab+cd')).toBe('http://api.test/x?sign=ab%2Bcd');
  });

  it('encodes every plus sign after the ? but leaves the path alone', () => {
    expect(encodeQueryPlusSigns('http://a+b.test/pa+th?x=1+2&y=3+4')).toBe('http://a+b.test/pa+th?x=1%2B2&y=3%2B4');
  });

  it('leaves URLs without a query untouched', () => {
    expect(encodeQueryPlusSigns('http://api.test/pa+th')).toBe('http://api.test/pa+th');
  });

  it('does not double-encode existing %2B escapes', () => {
    expect(encodeQueryPlusSigns('http://api.test/x?sign=ab%2Bcd')).toBe('http://api.test/x?sign=ab%2Bcd');
  });

  it('returns non-string input unchanged', () => {
    expect(encodeQueryPlusSigns(null)).toBe(null);
    expect(encodeQueryPlusSigns(undefined)).toBe(undefined);
    expect(encodeQueryPlusSigns('')).toBe('');
  });
});
