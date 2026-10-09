const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-key-en.json'), 'utf8'));
const missing = new Set(fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean));

const GARBAGE = [
  /^_blank$/, /^noreferrer/, /^mailto:/, /^https?:/,
  /^(flex|grid|block|inline|w-|h-|py-|px-|p-|m-|mt-|mb-|ml-|mr-|mx-|my-|text-|font-|bg-|border|rounded|opacity|hover|items|justify|gap|space-|cursor|transition|relative|absolute|hidden|truncate|overflow)/,
  /^(secondary|ghost|danger|primary|info|success|warning|default|off|false|true|null|none|button|input|label|value|name|sm|lg|md|xs)$/,
  /^(future-date|empty-text|empty-title|error-message|warning-icon|warning-text|section-title|modal-footer|textbox|preview|key-display|label|checkbox|tab-content|info-grid|info-item|inherited-name|environment-name|inheritance-warning|pkg-|errors-|method-dropdown|selected-|grpc-|oauth1-|change-version|env-|create-example|bruno-form|pkg-inline|pkg-spin|configFileName|exampleName|featureName|cookieName|domain|newVersion|onChange|value=|isOpen|disabled=|checked=|onClick=|className=|maxLength=|<input|<Button|<ErrorRow|export default).*$/,
  /\$\{[^}]*\}/,
  /^(get|post|put|delete|patch|head|options)$/i,
  /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/,
  /^rgba?\(/, /^#[0-9a-f]{3,8}$/i,
  /^(mt-2|mb-1|w-full|text-xs|text-sm|text-lg|text-red-600|text-link|block mb-1|block|off|false)$/
];
const isGarbage = (s) => !s || GARBAGE.some((re) => re.test(s)) || (s.length < 3 && !/^[A-Z*.\-]$/.test(s));

const badKeys = Object.entries(en)
  .filter(([k, v]) => missing.has(k) && isGarbage(v))
  .map(([k]) => k);
fs.writeFileSync(path.join(__dirname, 'garbage-en-keys.txt'), badKeys.join('\n'), 'utf8');
console.log('garbage EN keys:', badKeys.length, '/', Object.keys(en).length);
