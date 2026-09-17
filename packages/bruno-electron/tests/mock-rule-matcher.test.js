const {
  buildRequestContext,
  evaluateCondition,
  evaluateResponseCandidates,
  getJsonPathValue,
  matchesRules,
  selectMatchingResponse
} = require('../src/app/mock-server/mock-rule-matcher');

describe('mock-rule-matcher', () => {
  const context = {
    headers: { 'x-plan': 'premium' },
    query: { status: 'active' },
    body: { user: { type: 'admin' } }
  };

  it('reads json path values from body', () => {
    expect(getJsonPathValue(context.body, '$.user.type')).toBe('admin');
    expect(getJsonPathValue('{"id":1}', '$.id')).toBe(1);
  });

  it('evaluates header, query, and body conditions', () => {
    expect(evaluateCondition({
      target: 'header',
      key: 'X-Plan',
      operator: 'equals',
      value: 'premium'
    }, context)).toBe(true);

    expect(evaluateCondition({
      target: 'query',
      key: 'status',
      operator: 'equals',
      value: 'active'
    }, context)).toBe(true);

    expect(evaluateCondition({
      target: 'body',
      key: '$.user.type',
      operator: 'equals',
      value: 'admin'
    }, context)).toBe(true);

    expect(evaluateCondition({
      target: 'header',
      key: 'X-Plan',
      operator: 'not_equals',
      value: 'free'
    }, context)).toBe(true);

    expect(evaluateCondition({
      target: 'header',
      key: 'X-Plan',
      operator: 'matches',
      value: '^pre'
    }, context)).toBe(true);

    // legacy operator name still works
    expect(evaluateCondition({
      target: 'query',
      key: 'status',
      operator: 'regex',
      value: 'act.*'
    }, context)).toBe(true);
  });

  it('matches AND and OR rule groups', () => {
    expect(matchesRules({
      operator: 'AND',
      conditions: [
        { target: 'header', key: 'X-Plan', operator: 'equals', value: 'premium' },
        { target: 'query', key: 'status', operator: 'equals', value: 'active' }
      ]
    }, context)).toBe(true);

    expect(matchesRules({
      operator: 'OR',
      conditions: [
        { target: 'query', key: 'status', operator: 'equals', value: 'inactive' },
        { target: 'body', key: '$.user.type', operator: 'equals', value: 'admin' }
      ]
    }, context)).toBe(true);
  });

  it('selects first matching candidate in order', () => {
    const selected = selectMatchingResponse([
      {
        exampleName: 'premium',
        rules: {
          operator: 'AND',
          conditions: [{ target: 'header', key: 'X-Plan', operator: 'equals', value: 'premium' }]
        }
      },
      {
        exampleName: 'default',
        rules: { operator: 'AND', conditions: [] }
      }
    ], context);

    expect(selected.exampleName).toBe('premium');
  });

  it('returns match trace with per-condition results', () => {
    const { selected, trace } = evaluateResponseCandidates([
      {
        responseUid: 'premium',
        responseName: 'premium',
        rules: {
          operator: 'AND',
          conditions: [{ target: 'header', key: 'X-Plan', operator: 'equals', value: 'free' }]
        }
      },
      {
        responseUid: 'default',
        responseName: 'default',
        rules: { operator: 'AND', conditions: [] }
      }
    ], context);

    expect(selected.responseName).toBe('default');
    expect(trace.failureReason).toBeNull();
    expect(trace.selectionReason).toBe('fallback');
    expect(trace.selectedResponseUid).toBe('default');
    expect(trace.candidates).toHaveLength(2);
    expect(trace.candidates[0].matched).toBe(false);
    expect(trace.candidates[0].selected).toBe(false);
    expect(trace.candidates[0].conditions[0].pass).toBe(false);
    expect(trace.candidates[1].matched).toBe(true);
    expect(trace.candidates[1].selected).toBe(true);
    expect(trace.candidates[1].isFallback).toBe(true);
  });

  it('prefers specific rule match over earlier fallback candidate', () => {
    const { selected, trace } = evaluateResponseCandidates([
      {
        responseUid: 'fallback',
        responseName: 'fallback',
        rules: { operator: 'AND', conditions: [] }
      },
      {
        responseUid: 'specific',
        responseName: 'specific',
        rules: {
          operator: 'AND',
          conditions: [{ target: 'query', key: 'code', operator: 'equals', value: '400' }]
        }
      }
    ], {
      headers: {},
      query: { code: '400' },
      body: {}
    });

    expect(selected.responseUid).toBe('specific');
    expect(trace.selectionReason).toBe('specific_rules');
    expect(trace.candidates[0].matched).toBe(true);
    expect(trace.candidates[0].selected).toBe(false);
    expect(trace.candidates[1].selected).toBe(true);
  });

  it('returns no_rule_match trace when every candidate fails', () => {
    const { selected, trace } = evaluateResponseCandidates([
      {
        responseUid: 'premium',
        responseName: 'premium',
        rules: {
          operator: 'AND',
          conditions: [{ target: 'header', key: 'X-Plan', operator: 'equals', value: 'free' }]
        }
      }
    ], context);

    expect(selected).toBeNull();
    expect(trace.failureReason).toBe('no_rule_match');
    expect(trace.candidates[0].matched).toBe(false);
  });

  it('redacts sensitive rule values from the match trace without changing matching', () => {
    const { selected, trace } = evaluateResponseCandidates([
      {
        responseUid: 'authed',
        responseName: 'authed',
        rules: {
          operator: 'AND',
          conditions: [{ target: 'header', key: 'Authorization', operator: 'contains', value: 'Bearer' }]
        }
      }
    ], {
      headers: { authorization: 'Bearer super-secret-token' },
      query: {},
      body: {}
    });

    expect(selected.responseUid).toBe('authed');
    expect(trace.candidates[0].conditions[0].pass).toBe(true);
    expect(trace.candidates[0].conditions[0].actual).toBe('<redacted>');
    expect(JSON.stringify(trace)).not.toContain('super-secret-token');
  });

  it('builds request context from express req', () => {
    const built = buildRequestContext({
      headers: { 'content-type': 'application/json', 'X-Plan': 'free' },
      query: { page: '2' },
      body: { ok: true }
    });

    expect(built.headers['x-plan']).toBe('free');
    expect(built.query.page).toBe('2');
    expect(built.body.ok).toBe(true);
  });

  it('keeps plus signs in urlencoded form bodies', () => {
    const built = buildRequestContext({
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'sign=ab+cd%20ef&raw=1%2B2'
    });

    expect(built.form.sign).toBe('ab+cd ef');
    expect(built.form.raw).toBe('1+2');
  });
});

describe('mock-rule-matcher strategy layer', () => {
  const baseContext = { headers: {}, query: {}, body: undefined };

  it('never selects a response with probability 0', () => {
    const candidates = [{
      responseUid: 'p0',
      probability: 0,
      rules: { operator: 'AND', conditions: [] },
      response: { status: 200, headers: [], body: { type: 'text', content: 'never' } }
    }];

    for (let i = 0; i < 20; i++) {
      const { selected, trace } = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count: i + 1 } });
      expect(selected).toBeNull();
      expect(trace.failureReason).toBe('strategy_no_hit');
    }
  });

  it('always selects a response with probability 100', () => {
    const candidates = [{
      responseUid: 'p100',
      probability: 100,
      rules: { operator: 'AND', conditions: [] },
      response: { status: 200, headers: [], body: { type: 'text', content: 'always' } }
    }];

    const { selected } = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count: 1 } });
    expect(selected.responseUid).toBe('p100');
  });

  it('walks ordered candidates until one passes probability', () => {
    const candidates = [
      { responseUid: 'a', probability: 0, rules: { operator: 'AND', conditions: [] }, response: {} },
      { responseUid: 'b', probability: 100, rules: { operator: 'AND', conditions: [] }, response: {} }
    ];

    const { selected } = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count: 1 } });
    expect(selected.responseUid).toBe('b');
  });

  it('selects counter responses on every Nth hit with offset', () => {
    const candidates = [
      { responseUid: 'n1', counter: { every: 3 }, rules: { operator: 'AND', conditions: [] }, response: {} },
      { responseUid: 'fallback', rules: { operator: 'AND', conditions: [] }, response: {} }
    ];

    const picked = [];
    for (let count = 1; count <= 6; count++) {
      const { selected } = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count } });
      picked.push(selected.responseUid);
    }
    // hits 1, 4 go to the counter response; 2, 3, 5, 6 fall through to fallback
    expect(picked).toEqual(['n1', 'fallback', 'fallback', 'n1', 'fallback', 'fallback']);
  });

  it('reports no_rule_match when nothing matches and strategy_no_hit when rules match but strategy gates', () => {
    const candidates = [
      { responseUid: 'x', probability: 0, rules: { operator: 'AND', conditions: [{ target: 'query', key: 'a', operator: 'equals', value: 'b' }] }, response: {} }
    ];

    const miss = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count: 1 } });
    expect(miss.trace.failureReason).toBe('no_rule_match');

    const hit = evaluateResponseCandidates(
      candidates,
      { headers: {}, query: { a: 'b' }, body: undefined },
      { routeCounter: { count: 1 } }
    );
    expect(hit.trace.failureReason).toBe('strategy_no_hit');
  });

  it('records strategy outcomes in the trace', () => {
    const candidates = [
      { responseUid: 'p100', probability: 100, counter: { every: 1 }, rules: { operator: 'AND', conditions: [] }, response: {} }
    ];

    const { trace } = evaluateResponseCandidates(candidates, baseContext, { routeCounter: { count: 1 } });
    expect(trace.candidates[0].strategy.probability.hit).toBe(true);
    expect(trace.candidates[0].strategy.counter.hit).toBe(true);
  });
});
