const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-key-en.json'), 'utf8'));
const missing = new Set(fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean));

const CODEY = [
  /const\b/, /\blet\b/, /\bfunction\b/, /=>/, /\(\)\s*{/, /\{[^}]*\.(length|name|uid)\}/,
  /className|px-|py-|pb-|pt-|pl-|pr-|mb-|mt-|mx-|my-|gap-|text-\[|rounded|flex|grid|font-|cursor|hover:|opacity|inline-|block |settings-label|preset-|empty-state|status-dot|provider-status|auth-placement|token-placement|oauth1-dropdown|oauth2-|private-key-editor|single-line-editor|dropdown-icon|selected-|environment-name|inherited-name|warning-icon|info-icon|inherited-header|btn-action|bulk-edit|seg-|docs-tag|env-select|version-value|collection-name|version-line|version-summary|bruno-form|checkbox-option|load-error|schema-validation|error-message|error\.|formik\.|errors\.|props\.|state\.|window\.|event\.|JSON\.|toast\.|dispatch|require\(|import |export default|\breturn\b|<\/|\{$/,
  /^[\d.]+(px|rem|%)$/,
  /^\W*$/,
  /duplicate-name|unnamed|onDropdownCreate|onSchemaLoad|tippy|keydown|addEventListener|\.map\(|\.filter\(|\.join\(|\?\?|\?\./,
  /Icon[A-Z]|<Icon|<\/?[A-Z]\w*/, /aria-|data-testid|data-tooltip/,
  /\$\{[^}]*\}/
];
const codey = Object.entries(en).filter(([k, v]) => missing.has(k) && CODEY.some((re) => re.test(String(v))));
fs.writeFileSync(path.join(__dirname, 'codey-en-keys.txt'), codey.map(([k, v]) => k + '\t' + v).join('\n'), 'utf8');
console.log('codey EN values:', codey.length);
console.log(codey.slice(0, 60).map(([k, v]) => k).join('\n'));
