const fs = require('fs');
const ROOT = 'd:/bruno/packages/bruno-app/src/components/';

function apply(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  let fail = 0;
  for (const [find, replace] of pairs) {
    const f = find.split('\n').join(eol);
    const r = replace.split('\n').join(eol);
    const count = s.split(f).length - 1;
    if (count !== 1) {
      console.log('!! [' + count + ' matches] in ' + file + ' for: ' + JSON.stringify(find.slice(0, 80)));
      fail++;
      continue;
    }
    s = s.replace(f, r);
  }
  fs.writeFileSync(file, s, 'utf8');
  const v = fs.readFileSync(file, 'utf8');
  const fffd = (v.match(/\uFFFD/g) || []).length;
  console.log((fail ? 'PARTIAL ' : 'OK ') + file + ' | FFFD:' + fffd);
}

// ---------- AutocompletePane.js: normalize back to LF ----------
{
  const p = ROOT + 'Preferences/AI/AutocompletePane.js';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/\r\n/g, '\n');
  fs.writeFileSync(p, s, 'utf8');
  const v = fs.readFileSync(p, 'utf8');
  console.log('EOL-normalized AutocompletePane.js | CRLF:' + (v.match(/\r\n/g) || []).length + ' FFFD:' + (v.match(/\uFFFD/g) || []).length);
}

// ---------- SecurityPane.js ----------
apply(ROOT + 'Preferences/AI/SecurityPane.js', [
  ["import ToggleSwitch from 'components/ToggleSwitch';",
   "import ToggleSwitch from 'components/ToggleSwitch';\nimport { useTranslation } from 'react-i18next';"],

  ["const ChipListEditor = ({ list, placeholder, onChange, addTestId, inputTestId, removeTestIdPrefix }) => {\n  const [draft, setDraft] = useState('');",
   "const ChipListEditor = ({ list, placeholder, onChange, addTestId, inputTestId, removeTestIdPrefix }) => {\n  const { t } = useTranslation();\n  const [draft, setDraft] = useState('');"],

  ["          data-testid={addTestId}\n        >\n          Add\n        </button>",
   "          data-testid={addTestId}\n        >\n          {t('preferences.ai.card.add')}\n        </button>"],

  ["          Reached the {CHIP_MAX_COUNT}-entry limit. Remove one to add another.",
   "          {t('preferences.ai.security.chipLimitReached', { count: CHIP_MAX_COUNT })}"],

  ["aria-label={`Remove ${name}`}",
   "aria-label={t('preferences.ai.security.removeNamed', { name })}"],

  ["          Turn on AI in the Configuration tab to configure redaction.",
   "          {t('preferences.ai.security.disabledNotice')}"],

  ["        Sensitive data is automatically redacted before context is sent to AI providers. Turn off protections if needed, or add custom headers and variables to redact.",
   "        {t('preferences.ai.security.intro')}"],

  [">Redact sensitive header values</span>",
   ">{t('preferences.ai.security.redactHeadersTitle')}</span>"],

  ["              Masks Authorization, cookies, API keys and other credential-bearing headers in the request context.",
   "              {t('preferences.ai.security.redactHeadersDesc')}"],

  [">Redact sensitive body keys</span>",
   ">{t('preferences.ai.security.redactBodyTitle')}</span>"],

  ["              Masks values under keys like <code>password</code>, <code>*_token</code>, <code>secret</code> in JSON and GraphQL variables. Structure and non-sensitive fields still pass through.",
   "              {t('preferences.ai.security.redactBodyDesc')}"],

  [">Redact response values</span>",
   ">{t('preferences.ai.security.redactResponseTitle')}</span>"],

  ["              Sends the response as a shape only \u2014 real values replaced with type placeholders (<code>&lt;string&gt;</code>, <code>&lt;number&gt;</code>). Turn off to send the actual response body.",
   "              {t('preferences.ai.security.redactResponseDesc')}"],

  [">Redact secret variable values</span>",
   ">{t('preferences.ai.security.redactVariablesTitle')}</span>"],

  ["              Masks values whose names look like secrets. Variables explicitly marked <em>secret</em> are always redacted regardless of this switch.",
   "              {t('preferences.ai.security.redactVariablesDesc')}"],

  [">Custom redacted headers</span>",
   ">{t('preferences.ai.security.customHeadersTitle')}</span>"],

  ["              Exact, case-insensitive header names to always mask on top of the built-in list.",
   "              {t('preferences.ai.security.customHeadersDesc')}"],

  [">Custom redacted variables</span>",
   ">{t('preferences.ai.security.customVariablesTitle')}</span>"],

  ["              Variable names whose values should always be masked when Bruno lists them for the model \u2014 for anything you want redacted besides values already flagged as <em>secret</em>.",
   "              {t('preferences.ai.security.customVariablesDesc')}"],

  [">Already covered by default</span>",
   ">{t('preferences.ai.security.builtinCovered')}</span>"],

  ["              plus any name matching <code>token</code>, <code>secret</code>, <code>password</code> or <code>api_key</code>.",
   "              {t('preferences.ai.security.builtinMore')}"]
]);

// ---------- ProviderCard.js ----------
apply(ROOT + 'Preferences/AI/ProviderCard.js', [
  ["import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';",
   "import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';\nimport { useTranslation } from 'react-i18next';"],

  ["}) => {\n  const Logo = PROVIDER_LOGOS[provider.id];",
   "}) => {\n  const { t } = useTranslation();\n  const Logo = PROVIDER_LOGOS[provider.id];"],

  ["message: 'API key saved'",
   "message: t('preferences.ai.card.keySaved')"],

  ["message: err.message || 'Failed to save API key'",
   "message: err.message || t('preferences.ai.card.keySaveFailed')"],

  ["toast.success(`${provider.label} API key removed`);",
   "toast.success(t('preferences.ai.card.keyRemovedToast', { name: provider.label }));"],

  ["message: err.message || 'Failed to clear API key'",
   "message: err.message || t('preferences.ai.card.keyClearFailed')"],

  ["message: 'Connection successful'",
   "message: t('preferences.ai.card.connectionOk')"],

  ["message: result.error || 'Connection failed'",
   "message: result.error || t('preferences.ai.card.connectionFailed')"],

  ["message: err.message || 'Connection failed'",
   "message: err.message || t('preferences.ai.card.connectionFailed')"],

  ["              ? `${enabledModelsCount}/${models.length} models`\n              : 'Not configured'}",
   "              ? t('preferences.ai.card.modelsCount', { count: enabledModelsCount, total: models.length })\n              : t('preferences.ai.card.notConfigured')}"],

  ["<span>API Key</span>",
   "<span>{t('preferences.ai.card.apiKeyLabel')}</span>"],

  ["title=\"Test connection\"",
   "title={t('preferences.ai.card.testConnection')}"],

  ["aria-label=\"Test connection\"",
   "aria-label={t('preferences.ai.card.testConnection')}"],

  ["title=\"Replace key\"",
   "title={t('preferences.ai.card.replaceKey')}"],

  ["aria-label=\"Replace key\"",
   "aria-label={t('preferences.ai.card.replaceKey')}"],

  ["title=\"Remove key\"",
   "title={t('preferences.ai.card.removeKey')}"],

  ["aria-label=\"Remove key\"",
   "aria-label={t('preferences.ai.card.removeKey')}"],

  ["aria-label={showKey ? 'Hide API key' : 'Show API key'}",
   "aria-label={showKey ? t('preferences.ai.card.hideKey') : t('preferences.ai.card.showKey')}"],

  [" : <IconCheck size={13} />}\n                    Save\n",
   " : <IconCheck size={13} />}\n                    {t('common.save')}\n"],

  ["title=\"Cancel\"",
   "title={t('common.cancel')}"],

  ["<span>Models</span>",
   "<span>{t('preferences.ai.card.modelsLabel')}</span>"],

  ["                      Add an API key to enable",
   "                      {t('preferences.ai.card.keylessHint')}"]
]);

// ---------- CompatEndpointCard.js ----------
apply(ROOT + 'Preferences/AI/CompatEndpointCard.js', [
  ["import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';",
   "import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';\nimport { useTranslation } from 'react-i18next';"],

  ["}) => {\n  const [expanded, setExpanded] = useState(!endpoint.baseURL);",
   "}) => {\n  const { t } = useTranslation();\n  const [expanded, setExpanded] = useState(!endpoint.baseURL);"],

  ["message: 'API key saved'",
   "message: t('preferences.ai.card.keySaved')"],

  ["message: err.message || 'Failed to save API key'",
   "message: err.message || t('preferences.ai.card.keySaveFailed')"],

  ["toast.success(`${endpoint.name || 'Endpoint'} API key removed`);",
   "toast.success(t('preferences.ai.card.keyRemovedToast', { name: endpoint.name || t('preferences.ai.endpoint.fallbackName') }));"],

  ["message: err.message || 'Failed to clear API key'",
   "message: err.message || t('preferences.ai.card.keyClearFailed')"],

  ["message: 'Connection successful'",
   "message: t('preferences.ai.card.connectionOk')"],

  ["message: result.error || 'Connection failed'",
   "message: result.error || t('preferences.ai.card.connectionFailed')"],

  ["message: err.message || 'Connection failed'",
   "message: err.message || t('preferences.ai.card.connectionFailed')"],

  ["{endpoint.name || 'Unnamed endpoint'}",
   "{endpoint.name || t('preferences.ai.endpoint.unnamed')}"],

  ["              ? `${enabledModelsCount}/${models.length} model${models.length === 1 ? '' : 's'}`\n              : 'Not configured'}",
   "              ? t('preferences.ai.card.modelsCount', { count: enabledModelsCount, total: models.length })\n              : t('preferences.ai.card.notConfigured')}"],

  ["htmlFor={`endpoint-name-${endpoint.id}`}>\n                  Name\n",
   "htmlFor={`endpoint-name-${endpoint.id}`}>\n                  {t('preferences.ai.endpoint.nameLabel')}\n"],

  ["placeholder=\"e.g. Ollama local\"",
   "placeholder={t('preferences.ai.endpoint.namePlaceholder')}"],

  ["htmlFor={`endpoint-baseurl-${endpoint.id}`}>\n                  Base URL\n",
   "htmlFor={`endpoint-baseurl-${endpoint.id}`}>\n                  {t('preferences.ai.endpoint.baseUrlLabel')}\n"],

  ["<span>API Key <span className=\"opacity-60\">(optional)</span></span>",
   "<span>{t('preferences.ai.card.apiKeyLabel')} <span className=\"opacity-60\">{t('preferences.ai.card.apiKeyOptional')}</span></span>"],

  [">Not set</span>",
   ">{t('preferences.ai.endpoint.notSet')}</span>"],

  ["title={endpoint.baseURL ? 'Test connection' : 'Set Base URL first'}",
   "title={endpoint.baseURL ? t('preferences.ai.card.testConnection') : t('preferences.ai.endpoint.setBaseUrlFirst')}"],

  ["aria-label=\"Test connection\"",
   "aria-label={t('preferences.ai.card.testConnection')}"],

  ["title={provider.hasApiKey ? 'Replace key' : 'Add key'}",
   "title={provider.hasApiKey ? t('preferences.ai.card.replaceKey') : t('preferences.ai.card.addKey')}"],

  ["aria-label={provider.hasApiKey ? 'Replace key' : 'Add key'}",
   "aria-label={provider.hasApiKey ? t('preferences.ai.card.replaceKey') : t('preferences.ai.card.addKey')}"],

  ["title=\"Remove key\"",
   "title={t('preferences.ai.card.removeKey')}"],

  ["aria-label=\"Remove key\"",
   "aria-label={t('preferences.ai.card.removeKey')}"],

  ["aria-label={showKey ? 'Hide API key' : 'Show API key'}",
   "aria-label={showKey ? t('preferences.ai.card.hideKey') : t('preferences.ai.card.showKey')}"],

  [" : <IconCheck size={13} />}\n                    Save\n",
   " : <IconCheck size={13} />}\n                    {t('common.save')}\n"],

  ["title=\"Cancel\"",
   "title={t('common.cancel')}"],

  ["                  Saving endpoint\u2026\n",
   "                  {t('preferences.ai.endpoint.saving')}\n"],

  ["<span>Models</span>",
   "<span>{t('preferences.ai.card.modelsLabel')}</span>"],

  ["                    Set a Base URL to enable\n",
   "                    {t('preferences.ai.endpoint.setBaseUrlHint')}\n"],

  ["                  No models yet. Add the model id your provider expects (e.g. <code>gpt-4o</code> or <code>llama3.1:8b</code>).",
   "                  {t('preferences.ai.endpoint.modelsEmpty')}"],

  ["placeholder=\"Display name\"",
   "placeholder={t('preferences.ai.endpoint.displayNamePlaceholder')}"],

  ["placeholder=\"Model id\"",
   "placeholder={t('preferences.ai.endpoint.modelIdPlaceholder')}"],

  ["title=\"Remove model\"",
   "title={t('preferences.ai.card.removeModel')}"],

  ["aria-label=\"Remove model\"",
   "aria-label={t('preferences.ai.card.removeModel')}"],

  ["placeholder=\"Model id (required)\"",
   "placeholder={t('preferences.ai.endpoint.modelIdRequiredPlaceholder')}"],

  ["placeholder=\"Label (optional)\"",
   "placeholder={t('preferences.ai.endpoint.labelOptionalPlaceholder')}"],

  ["<IconPlus size={13} />\n                  Add\n",
   "<IconPlus size={13} />\n                  {t('preferences.ai.card.add')}\n"],

  ["<IconTrash size={12} />\n                Remove endpoint\n",
   "<IconTrash size={12} />\n                {t('preferences.ai.endpoint.removeEndpoint')}\n"]
]);

// ---------- AI/index.js ----------
apply(ROOT + 'Preferences/AI/index.js', [
  ["      name: `Endpoint ${endpoints.length + 1}`,",
   "      name: t('preferences.ai.defaultEndpointName', { index: endpoints.length + 1 }),"]
]);

// ---------- AutocompletePane.spec.js: add react-i18next mock ----------
{
  const p = ROOT + 'Preferences/AI/AutocompletePane.spec.js';
  let s = fs.readFileSync(p, 'utf8');
  const anchor = "import AutocompletePane from './AutocompletePane';\n";
  if (!s.includes(anchor)) {
    console.log('!! spec anchor not found');
  } else if (s.includes("react-i18next")) {
    console.log('!! spec already mocks react-i18next');
  } else {
    const mock = [
      '',
      "jest.mock('react-i18next', () => {",
      '  const translations = {',
      "    'preferences.ai.autocomplete.title': 'Inline Autocomplete',",
      "    'preferences.ai.autocomplete.subtitle': 'Ghost-text suggestions in Pre-Request, Post-Response, and Tests scripts',",
      "    'preferences.ai.autocomplete.disabledNotice': 'Turn on AI in the Configuration tab to use autocomplete.',",
      "    'preferences.ai.autocomplete.blockerNoProvider': 'Add a provider API key in the Configuration tab to enable autocomplete.',",
      "    'preferences.ai.autocomplete.blockerNoModel': 'No models are available. Enable a model on its provider card in Configuration.',",
      "    'preferences.ai.autocomplete.modelLabel': 'Model',",
      "    'preferences.ai.autocomplete.modelHint': 'Lightweight models are recommended for speed',",
      "    'preferences.ai.autocomplete.modelEmpty': 'No model available yet',",
      "    'preferences.ai.autocomplete.modelSelectAria': 'Autocomplete model',",
      "    'preferences.ai.autocomplete.modelAuto': 'Auto (fastest available)',",
      "    'preferences.ai.autocomplete.triggerLabel': 'Trigger',",
      "    'preferences.ai.autocomplete.triggerAria': 'Trigger mode',",
      "    'preferences.ai.autocomplete.triggerAggressive': 'Aggressive',",
      "    'preferences.ai.autocomplete.triggerAggressiveDesc': 'Suggest after every keystroke',",
      "    'preferences.ai.autocomplete.triggerDebounced': 'Debounced',",
      "    'preferences.ai.autocomplete.triggerDebouncedDesc': 'Suggest after you pause typing (default)',",
      "    'preferences.ai.autocomplete.triggerManual': 'Manual',",
      "    'preferences.ai.autocomplete.triggerManualDesc': 'Only on {{modifier}}+\\',",
      "    'preferences.ai.autocomplete.keymapLabel': 'Keymap',",
      "    'preferences.ai.autocomplete.keymapAccept': 'accept',",
      "    'preferences.ai.autocomplete.keymapAcceptWord': 'accept word',",
      "    'preferences.ai.autocomplete.keymapDismiss': 'dismiss',",
      "    'preferences.ai.autocomplete.keymapTrigger': 'trigger'",
      '  };',
      '  return {',
      '    useTranslation: () => ({',
      "      t: (key, params) => String(translations[key] ?? key).replace(/\\{\\{(\\w+)\\}\\}/g, (_, k) => params?.[k] ?? '')",
      '    })',
      '  };',
      '});',
      ''
    ].join('\n');
    s = s.replace(anchor, anchor + mock);
    fs.writeFileSync(p, s, 'utf8');
    console.log('OK spec mock added | FFFD:' + (fs.readFileSync(p, 'utf8').match(/\uFFFD/g) || []).length);
  }
}
