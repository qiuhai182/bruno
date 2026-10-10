const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation');
const FFFD = '\uFFFD';

const fix = {
  'environments.export.exportCount': { en: 'Export {{num}} Environments', zh: '导出 {{num}} 个环境' },
  'environments.import.successOne': { en: 'Environment imported successfully', zh: '环境导入成功' },
  'environments.import.successOther': { en: '{{num}} environments imported successfully', zh: '{{num}} 个环境导入成功' },
  'collection.example.body': { en: 'Body', zh: '请求体' },
  'sidebar.apiSpecs.close.title': { en: 'Close Api Spec', zh: '关闭 API Spec' }
};

function apply(file, lang) {
  const p = path.join(SRC, file);
  const o = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const [k, v] of Object.entries(fix)) {
    const parts = k.split('.');
    let cur = o;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    if (cur[parts[parts.length - 1]] === undefined) { console.log('!! key not found in ' + file + ': ' + k); continue; }
    cur[parts[parts.length - 1]] = v[lang];
    n++;
  }
  fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');
  const chk = fs.readFileSync(p, 'utf8');
  if (chk.includes(FFFD)) throw new Error('FFFD in ' + file);
  console.log(file + ': ' + n + ' fixed');
}
apply('en.json', 'en');
apply('zh-CN.json', 'zh');
console.log('DONE');
