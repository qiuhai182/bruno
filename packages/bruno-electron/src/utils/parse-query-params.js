const decodeComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
};

/**
 * Parse a urlencoded string (query string or form body) into an object
 * without treating '+' as a space, so values that contain plus signs
 * (e.g. base64 signatures like ?sign=a+b+c) are recognized as-is and
 * callers don't need to write %2B. Percent escapes are still decoded
 * (%2B also yields '+'), and malformed escapes are kept as-is.
 * Repeated keys are collected into an array.
 */
const parseQueryParamsPreservingPlus = (input) => {
  const result = {};

  if (!input || typeof input !== 'string') {
    return result;
  }

  for (const pair of input.split('&')) {
    if (!pair) {
      continue;
    }

    const eq = pair.indexOf('=');
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawValue = eq === -1 ? '' : pair.slice(eq + 1);
    const key = decodeComponent(rawKey);

    if (!key) {
      continue;
    }

    const value = decodeComponent(rawValue);
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Encode literal '+' characters in the query part of a URL to '%2B', so
 * servers following the form-urlencoded convention (which decodes '+' as a
 * space) receive the plus sign as data. Applied at the wire boundary:
 * users type '+' in a param value and the request carries '%2B' on the
 * wire without them having to write it. The path part is untouched ('+'
 * is unambiguous there), and the query structure ('?', '&', '=') is
 * preserved. Already-encoded URLs are unaffected ('%2B' has no literal '+').
 */
const encodeQueryPlusSigns = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const queryIdx = url.indexOf('?');
  if (queryIdx === -1) {
    return url;
  }

  return url.slice(0, queryIdx) + url.slice(queryIdx).replace(/\+/g, '%2B');
};

module.exports = { parseQueryParamsPreservingPlus, encodeQueryPlusSigns };
