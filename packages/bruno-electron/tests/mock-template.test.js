const {
  buildTemplateContext,
  coerceValue,
  renderTemplate
} = require('../src/app/mock-server/mock-template');

describe('mock-template', () => {
  describe('renderTemplate', () => {
    it('leaves plain text untouched', () => {
      expect(renderTemplate('no tokens here', {})).toBe('no tokens here');
    });

    it('resolves query, header, param and extract values', () => {
      const context = {
        param: { id: '42' },
        query: { page: '2' },
        header: { 'x-user': 'admin' },
        extract: { token: 'abc' }
      };

      expect(renderTemplate('/items/{{param.id}}?page={{query.page}}', context)).toBe('/items/42?page=2');
      expect(renderTemplate('{{header.x-user}}', context)).toBe('admin');
      expect(renderTemplate('Bearer {{extract.token}}', context)).toBe('Bearer abc');
    });

    it('resolves dotted body paths from objects and JSON strings', () => {
      expect(renderTemplate('{{body.user.name}}', { body: { user: { name: 'neo' } } })).toBe('neo');
      expect(renderTemplate('{{body.user.name}}', { body: '{"user":{"name":"neo"}}' })).toBe('neo');
    });

    it('returns empty string for missing values', () => {
      expect(renderTemplate('[{{query.missing}}]', { query: {} })).toBe('[]');
    });

    it('supports typed tokens', () => {
      expect(renderTemplate('{{@int:query.count}}', { query: { count: '5' } })).toBe('5');
      expect(coerceValue('@int', '5')).toBe(5);
      expect(coerceValue('@float', '1.5')).toBe(1.5);
      expect(coerceValue('@bool', 'true')).toBe(true);
      expect(coerceValue('@bool', '0')).toBe(false);
      // unparseable values fall back to the original string
      expect(coerceValue('@int', 'abc')).toBe('abc');
    });

    it('stringifies object values', () => {
      expect(renderTemplate('{{body.user}}', { body: { user: { id: 1 } } })).toBe('{"id":1}');
    });
  });

  describe('buildTemplateContext', () => {
    it('evaluates extract rules into the context', () => {
      const context = {
        param: { id: '7' },
        query: { q: 'x' },
        header: { 'x-a': 'A' },
        body: { deep: { key: 'v' } },
        form: { f: 'F' }
      };

      const built = buildTemplateContext(context, [
        { source: 'param', key: 'id', as: 'pid' },
        { source: 'query', key: 'q', as: 'q' },
        { source: 'header', key: 'X-A', as: 'a' },
        { source: 'body', key: 'deep.key', as: 'deep' },
        { source: 'form', key: 'f', as: 'f' }
      ]);

      expect(built.extract).toEqual({ pid: '7', q: 'x', a: 'A', deep: 'v', f: 'F' });
      expect(renderTemplate('{{extract.deep}}/{{extract.pid}}', built)).toBe('v/7');
    });

    it('defaults extract source to query when unknown', () => {
      const built = buildTemplateContext({ query: { k: 'v' } }, [{ source: 'nope', key: 'k', as: 'k' }]);
      expect(built.extract.k).toBe('v');
    });
  });
});
