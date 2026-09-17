const { safeStringifyJSON } = require('../../utils/common');

const TOKEN_RE = /\{\{\s*(@int|@float|@bool)?\s*:?\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

const parseBodyValue = (body) => {
  if (typeof body !== 'string') {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const resolvePath = (context, path) => {
  const segments = path.split('.').filter(Boolean);

  return segments.reduce((current, segment) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (typeof current === 'string') {
      // Allow dotted paths to traverse JSON-encoded strings (e.g. a raw body).
      try {
        current = JSON.parse(current);
      } catch {
        return undefined;
      }
    }

    return current[segment];
  }, context);
};

const coerceValue = (type, value) => {
  if (value === undefined || value === null) {
    return value;
  }

  const text = String(value);

  if (type === '@int') {
    const parsed = Number.parseInt(text, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }

  if (type === '@float') {
    const parsed = Number.parseFloat(text);
    return Number.isNaN(parsed) ? value : parsed;
  }

  if (type === '@bool') {
    const normalized = text.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return value;
  }

  return value;
};

/**
 * Renders {{path}} / {{@int:path}} / {{@float:path}} / {{@bool:path}} tokens
 * in a mock response body or header value.
 *
 * Template context roots: param, query, header, body, form, extract.
 */
const renderTemplate = (template, context) => {
  if (typeof template !== 'string' || !template.includes('{{')) {
    return template;
  }

  return template.replace(TOKEN_RE, (match, type, path) => {
    const value = resolvePath(context, path);

    if (value === undefined || value === null) {
      return '';
    }

    if (type) {
      const coerced = coerceValue(type, value);
      if (coerced === undefined || coerced === null) {
        return '';
      }
      return typeof coerced === 'object' ? safeStringifyJSON(coerced) : String(coerced);
    }

    if (typeof value === 'object') {
      return safeStringifyJSON(value);
    }

    return String(value);
  });
};

const getExtractValue = (source, key, context) => {
  if (!key) {
    return undefined;
  }

  switch (source) {
    case 'header':
      return context.header?.[key.toLowerCase()];
    case 'query':
      return context.query?.[key];
    case 'param':
      return context.param?.[key];
    case 'form':
      return context.form?.[key];
    case 'body':
      return resolvePath({ body: context.body }, `body.${key}`);
    default:
      // Unknown sources fall back to query so hand-written rules still work.
      return context.query?.[key];
    }
};

/**
 * Builds the template context: request accessors plus `extract` values
 * evaluated from the request (rules hit before rendering).
 */
const buildTemplateContext = (context, extractRules) => {
  const extract = {};

  for (const rule of extractRules || []) {
    if (!rule?.as) {
      continue;
    }
    extract[rule.as] = getExtractValue(rule.source, rule.key, context);
  }

  return {
    param: context.param || {},
    query: context.query || {},
    header: context.header || {},
    body: parseBodyValue(context.body),
    form: context.form || {},
    extract
  };
};

module.exports = {
  buildTemplateContext,
  coerceValue,
  getExtractValue,
  renderTemplate,
  resolvePath
};
