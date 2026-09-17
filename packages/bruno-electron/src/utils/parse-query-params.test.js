const { parseQueryParamsPreservingPlus } = require('./parse-query-params');

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
