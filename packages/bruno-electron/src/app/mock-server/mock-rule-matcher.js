const { isSensitiveName, REDACTED_VALUE } = require('../../ipc/ai/context');
const { parseQueryParamsPreservingPlus } = require('../../utils/parse-query-params');

const getJsonPathValue = (body, jsonPath) => {
  if (body === undefined || body === null) {
    return undefined;
  }

  let parsed = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return undefined;
    }
  }

  if (!jsonPath || jsonPath === '$') {
    return parsed;
  }

  const normalizedPath = jsonPath.replace(/^\$\.?/, '');
  if (!normalizedPath) {
    return parsed;
  }

  return normalizedPath.split('.').filter(Boolean).reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    return current[key];
  }, parsed);
};

const getActualValue = (condition, context) => {
  const target = condition?.target;
  const key = condition?.key || '';

  if (target === 'header') {
    const headerKey = key.toLowerCase();
    return context.headers?.[headerKey];
  }

  if (target === 'query') {
    return context.query?.[key];
  }

  if (target === 'body') {
    return getJsonPathValue(context.body, key);
  }

  return undefined;
};

const compareValues = (operator, actual, expected) => {
  const actualText = actual === undefined || actual === null ? '' : String(actual);
  const expectedText = expected === undefined || expected === null ? '' : String(expected);

  switch (operator) {
    case 'matches':
    case 'regex': // legacy alias
      try {
        return new RegExp(expectedText).test(actualText);
      } catch {
        return false;
      }
    case 'contains':
      return actualText.includes(expectedText);
    case 'not_equals':
      return actualText !== expectedText;
    case 'equals':
    default:
      return actualText === expectedText;
  }
};

const redactActualValue = (key, actual) => {
  if (actual === undefined || actual === null) {
    return null;
  }

  return isSensitiveName(key) ? REDACTED_VALUE : actual;
};

const evaluateCondition = (condition, context) => {
  if (!condition?.target) {
    return true;
  }

  const actual = getActualValue(condition, context);
  return compareValues(condition.operator || 'equals', actual, condition.value);
};

const evaluateConditionDetail = (condition, context) => {
  if (!condition?.target) {
    return {
      pass: true,
      target: null,
      key: null,
      operator: null,
      expected: null,
      actual: null
    };
  }

  const actual = getActualValue(condition, context);
  return {
    pass: compareValues(condition.operator || 'equals', actual, condition.value),
    target: condition.target,
    key: condition.key || '',
    operator: condition.operator || 'equals',
    expected: condition.value ?? null,
    actual: redactActualValue(condition.key, actual)
  };
};

const matchesRules = (rules, context) => {
  const conditions = rules?.conditions || [];

  if (!conditions.length) {
    return true;
  }

  const operator = rules?.operator === 'OR' ? 'OR' : 'AND';
  const results = conditions.map((condition) => evaluateCondition(condition, context));

  return operator === 'OR'
    ? results.some(Boolean)
    : results.every(Boolean);
};

const evaluateRulesDetail = (rules, context) => {
  const conditions = rules?.conditions || [];

  if (!conditions.length) {
    return {
      matched: true,
      operator: rules?.operator === 'OR' ? 'OR' : 'AND',
      conditions: [],
      isFallback: true
    };
  }

  const operator = rules?.operator === 'OR' ? 'OR' : 'AND';
  const conditionResults = conditions.map((condition) => evaluateConditionDetail(condition, context));
  const matched = operator === 'OR'
    ? conditionResults.some((result) => result.pass)
    : conditionResults.every((result) => result.pass);

  return {
    matched,
    operator,
    conditions: conditionResults,
    isFallback: false
  };
};

const parseFormBody = (req, body) => {
  const contentType = String(req?.headers?.['content-type'] || '');
  if (typeof body !== 'string' || !contentType.includes('application/x-www-form-urlencoded')) {
    return {};
  }

  try {
    return parseQueryParamsPreservingPlus(body);
  } catch {
    return {};
  }
};

const buildRequestContext = (req, params = {}) => {
  const headers = {};
  for (const [name, value] of Object.entries(req.headers || {})) {
    headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
  }

  return {
    headers,
    query: req.query || {},
    body: req.body,
    param: params || {},
    form: parseFormBody(req, req.body)
  };
};

const passesResponseStrategy = (candidate, routeCounter, traceEntry) => {
  const probability = Number(candidate?.probability);

  if (!Number.isNaN(probability) && candidate?.probability !== undefined && candidate?.probability !== null) {
    const hit = Math.random() * 100 < probability;
    traceEntry.strategy = { ...(traceEntry.strategy || {}), probability: { value: probability, hit } };
    if (!hit) {
      return false;
    }
  }

  const every = Number(candidate?.counter?.every);
  if (every >= 1) {
    const count = Number(routeCounter?.count) || 0;
    const offset = Number(candidate?.counter?.offset) || 0;
    const hit = ((count - 1 + offset) % every) === 0;
    traceEntry.strategy = { ...(traceEntry.strategy || {}), counter: { every, offset, hit } };
    if (!hit) {
      return false;
    }
  }

  return true;
};

const evaluateResponseCandidates = (candidates, context, options = {}) => {
  const routeCounter = options?.routeCounter || null;
  const trace = {
    candidates: [],
    selectedResponseUid: null,
    selectedResponseName: null,
    selectionReason: null,
    failureReason: null
  };

  if (!candidates?.length) {
    trace.failureReason = 'no_route';
    return { selected: null, trace };
  }

  const evaluated = candidates.map((candidate) => {
    const ruleEval = evaluateRulesDetail(candidate.rules, context);
    return {
      candidate,
      ruleEval,
      isFallback: ruleEval.isFallback
    };
  });

  const specificMatches = evaluated.filter(({ ruleEval, isFallback }) => !isFallback && ruleEval.matched);
  const fallbackMatches = evaluated.filter(({ ruleEval, isFallback }) => isFallback && ruleEval.matched);

  // Strategy layer (probability / counter) walks rule-matched candidates in
  // order; the first candidate that passes its gates wins.
  const pickWithStrategy = (entries) => {
    for (const entry of entries) {
      const traceEntry = trace.candidates.find((t) => t.candidate === entry.candidate);
      if (passesResponseStrategy(entry.candidate, routeCounter, traceEntry)) {
        return entry;
      }
    }
    return null;
  };

  const evaluatedTraceEntries = evaluated.map(({ candidate, ruleEval, isFallback }) => ({
    candidate,
    responseUid: candidate.responseUid || null,
    responseName: candidate.responseName || candidate.exampleName || 'Mock Response',
    matched: ruleEval.matched,
    selected: false,
    isFallback,
    ruleOperator: ruleEval.operator,
    conditions: ruleEval.conditions,
    strategy: null
  }));
  trace.candidates = evaluatedTraceEntries;

  const selectedEntry = pickWithStrategy(specificMatches) || pickWithStrategy(fallbackMatches) || null;

  for (const entry of evaluatedTraceEntries) {
    entry.selected = Boolean(selectedEntry && selectedEntry.candidate === entry.candidate);
  }

  if (selectedEntry) {
    trace.selectedResponseUid = selectedEntry.candidate.responseUid || null;
    trace.selectedResponseName = selectedEntry.candidate.responseName || selectedEntry.candidate.exampleName || 'Mock Response';
    trace.selectionReason = selectedEntry.isFallback ? 'fallback' : 'specific_rules';
    return { selected: selectedEntry.candidate, trace };
  }

  trace.failureReason = (specificMatches.length || fallbackMatches.length) ? 'strategy_no_hit' : 'no_rule_match';
  return { selected: null, trace };
};

const selectMatchingResponse = (candidates, context) => (
  evaluateResponseCandidates(candidates, context).selected
);

module.exports = {
  buildRequestContext,
  compareValues,
  evaluateCondition,
  evaluateConditionDetail,
  evaluateResponseCandidates,
  evaluateRulesDetail,
  getJsonPathValue,
  matchesRules,
  selectMatchingResponse
};
