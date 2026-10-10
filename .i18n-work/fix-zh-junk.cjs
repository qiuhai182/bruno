const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'zh-CN.json');
const FFFD = '\uFFFD';

// Chinese values as unicode escapes (script file must stay pure ASCII on this machine)
const fix = {
  'environments.export.exportCount': '\u5bfc\u51fa {{num}} \u4e2a\u73af\u5883', // 导出 {{num}} 个环境
  'environments.import.successOne': '\u73af\u5883\u5bfc\u5165\u6210\u529f', // 环境导入成功
  'environments.import.successOther': '{{num}} \u4e2a\u73af\u5883\u5bfc\u5165\u6210\u529f', // {{num}} 个环境导入成功
  'collection.example.body': '\u8bf7\u6c42\u4f53', // 请求体
  'sidebar.apiSpecs.close.title': '\u5173\u95ed API Spec' // 关闭 API Spec
};

const o = JSON.parse(fs.readFileSync(p, 'utf8'));
for (const [k, v] of Object.entries(fix)) {
  const parts = k.split('.');
  let cur = o;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = v;
}
const flat = (obj, pre = '') =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, pre + k + '.') : [[pre + k, v]]));
const bad = flat(o).filter(([, v]) => typeof v === 'string' && v.includes(FFFD));
console.log('remaining FFFD values:', bad.length);
bad.forEach(([k]) => console.log('  STILL BAD:', k));
const out = JSON.stringify(o, null, 2) + '\n';
if (out.includes(FFFD)) { console.log('output FFFD, abort'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'zh-cn-fix.b64'), Buffer.from(out, 'utf8').toString('base64'), 'ascii');
console.log('base64 emitted OK, json length:', out.length);
