const fs = require('fs');
const { execSync } = require('child_process');
// Get pristine HEAD version of ProviderCard.js
const head = execSync('git show HEAD:packages/bruno-app/src/components/Preferences/AI/ProviderCard.js', { cwd: 'd:/bruno', maxBuffer: 10 * 1024 * 1024 });
fs.writeFileSync('d:/bruno/.i18n-work/repro-input.js', head);
let s = fs.readFileSync('d:/bruno/.i18n-work/repro-input.js', 'utf8');
console.log('bullets before:', (s.match(/\u2022/g) || []).length, 'FFFD before:', (s.match(/\uFFFD/g) || []).length);

const eol = s.includes('\r\n') ? '\r\n' : '\n';
// exact same pairs as apply-i18n.js for ProviderCard
const pairs = [
  ["import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';",
   "import { clearAiApiKey, getAiApiKey, setAiApiKey, testAiProvider } from 'utils/ai';\nimport { useTranslation } from 'react-i18next';"],
  ["toast.success(`${provider.label} API key removed`);",
   "toast.success(t('preferences.ai.card.keyRemovedToast', { name: provider.label }));"],
  ["              ? `${enabledModelsCount}/${models.length} models`\n              : 'Not configured'}",
   "              ? t('preferences.ai.card.modelsCount', { count: enabledModelsCount, total: models.length })\n              : t('preferences.ai.card.notConfigured')}"]
];
for (const [find, replace] of pairs) {
  const f = find.split('\n').join(eol);
  const r = replace.split('\n').join(eol);
  s = s.replace(f, r);
}
fs.writeFileSync('d:/bruno/.i18n-work/repro-output.js', s, 'utf8');
const v = fs.readFileSync('d:/bruno/.i18n-work/repro-output.js', 'utf8');
console.log('bullets after:', (v.match(/\u2022/g) || []).length, 'FFFD after:', (v.match(/\uFFFD/g) || []).length);
