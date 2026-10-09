#!/usr/bin/env node
/**
 * Verifies zh2-group-*.json translations against en2-group-*.json sources.
 *
 * Checks:
 *  1. every key from the union of en-overrides{,-2,-3}.json exists in a zh2 file and
 *     matches the expected revised translation (EXPECT_ZH) — i.e. was updated for the
 *     revised English; override-only keys must also exist in en2 (key-set parity)
 *  2. all 14 en2/zh2 pairs have identical key sets
 *  3. no empty values (zh2)
 *  4. no U+FFFD replacement char in zh2 values
 *  5. {{placeholder}} sets match, except {{s}} may be dropped in zh
 *  6. English trailing "..." is preserved in Chinese (loading messages)
 *  7. en2 values match the override files (except the known mojibake key)
 *  8. task-critical JSX-fragment compositions have the mandated Chinese fragments
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const PLACEHOLDER_RE = /\{\{([^{}]+)\}\}/g;

function placeholders(str) {
  const set = new Set();
  let m;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(str)) !== null) set.add(m[1]);
  return set;
}

// ---------------------------------------------------------------------------
// Revised translations authored for keys whose English was changed by the
// override files (68 updated + 5 override-only keys added).
const EXPECT_ZH = {
  'collection.auth.descriptionPrefix': '配置整个集合的认证方式。这适用于所有使用',
  'collection.auth.descriptionMiddle': '选项的请求（在',
  'collection.auth.descriptionSuffix': ' 标签页中）。',
  'collection.auth.authTab': 'Auth',
  'collection.auth.oauth2.tbd': '待定',
  'collection.common.removeFile': '移除文件',
  'collection.overview.change': '更改',
  'collection.presets.defaultBaseUrl': '默认 Base URL',
  'collection.presets.defaultBaseUrlSubtitle': '为新请求预填 URL 字段。',
  'collection.presets.defaultEnvironment': '默认环境',
  'collection.presets.defaultEnvironmentSubtitle': '共享此集合并首次打开时选中。',
  'collection.presets.defaultRequestType': '默认请求类型',
  'collection.presets.defaultRequestTypeSubtitle': '新请求默认选中此项。',
  'collection.proxy.disabled': '禁用',
  'collection.proxy.enabled': '启用',
  'collection.proxy.inherit': '继承',
  'devtools.performance.currentCpu': '当前 CPU 占用',
  'devtools.performance.currentMemory': '当前内存占用',
  'devtools.performance.processPid': '进程 PID',
  'devtools.requestDetails.noHeaders': '无标头',
  'devtools.requestDetails.noNetworkLogs': '无网络日志',
  'devtools.requestDetails.noResponseData': '无响应数据',
  'devtools.terminal.loadingSessions': '正在加载会话...',
  'devtools.terminal.noActiveSessions': '无活动会话',
  'environments.delete.confirmSuffix': ' 环境吗？此操作无法撤销。',
  'environments.dotEnv.confirmSuffix': ' .env 文件吗？此操作无法撤销。',
  'environments.inheritance.circular': '检测到循环继承：{{path}}',
  'environments.validation.alreadyExists': '已存在同名环境',
  'environments.validation.globalAlreadyExists': '已存在同名的全局环境',
  'notifications.menuAriaLabel': '打开通知菜单',
  'preferences.ai.autocomplete.triggerAria': '触发模式',
  'requestPane.errorOccurred': '发生错误！',
  'requestPane.grpc.errorOccurred': '发生错误！',
  'requestPane.grpc.noAuth': '无认证',
  'requestPane.ws.errorOccurred': '发生错误！',
  'requestPane.ws.noAuth': '无认证',
  'requestPane.queryBuilder.failedToLoadSchema': '加载 Schema 失败',
  'requestPane.queryBuilder.noSchemaLoaded': '未加载 Schema',
  'requestPane.queryBuilder.somethingWentWrong': '出了点问题',
  'requestPane.auth.authTab': 'Auth',
  'requestPane.auth.descriptionMiddle': '选项的请求（在',
  'requestPane.auth.descriptionSuffix': ' 标签页中）。',
  'requestPane.auth.inherit': '继承',
  'sidebar.bulkImport.groupingTags': '标签',
  'sidebar.bulkImport.groupingTagsDesc': '按 OpenAPI/Swagger 标签对请求分组',
  'sidebar.changeVersion.collectionLabel': '集合：',
  'sidebar.changeVersion.title': '更改集合版本',
  'sidebar.changeVersion.into': '位于',
  'sidebar.docs.allRequests': '所有请求',
  'sidebar.docs.notSet': '未设置',
  'sidebar.docs.title': '生成文档',
  'sidebar.exportToPostman.fileExists': '已存在同名文件',
  'sidebar.fileFormat.bruDesc': 'Bruno 原生文件格式（.bru 文件）',
  'sidebar.fileFormat.bruTitle': 'BRU',
  'sidebar.goldenEdition.supportBruno': '支持 Bruno 的发展',
  'sidebar.import.groupingTags': '标签',
  'sidebar.import.groupingTagsDesc': '按 OpenAPI/Swagger 标签对请求分组',
  'sidebar.import.loading1': '正在处理集合...',
  'sidebar.import.loading2': '正在分析请求...',
  'sidebar.import.loading3': '正在转换脚本...',
  'sidebar.import.loading4': '正在准备集合...',
  'sidebar.import.loading5': '即将完成...',
  'sidebar.moveToWorkspace.description': '这将把以下集合的文件移动到 {{name}} 工作区。',
  'sidebar.newRequest.fileNameHelp1': 'Bruno 将每个请求保存为集合文件夹中的文件。',
  'sidebar.postmanReport.customPackagesPrefix': '自定义 npm 包（例如 ',
  'sidebar.postmanReport.customPackagesMid': '）已安装，但该集合目前正在以',
  'sidebar.postmanReport.safeMode': '安全模式',
  'sidebar.postmanReport.customPackagesSuffix': '运行。',
  'sidebar.ignore.prefix': '忽略',
  'sidebar.ignore.hideFrom': ' 将使其从该',
  'sidebar.ignore.finalPeriod': '。',
  'sidebar.closeWorkspace.confirmSuffix': ' 工作区吗？它仍保留在文件系统中的上述位置，可随时重新打开。',
  'workspace.remove.confirmSuffix': ' 工作区吗？该工作区仍保留在文件系统中，可随时重新打开。'
};

// Mandated fragment values for JSX compositions (task spec)
const FRAGMENTS = {
  'sidebar.postmanReport.customPackagesPrefix': '自定义 npm 包（例如 ',
  'sidebar.postmanReport.customPackagesMid': '）已安装，但该集合目前正在以',
  'sidebar.postmanReport.safeMode': '安全模式',
  'sidebar.postmanReport.customPackagesSuffix': '运行。',
  'collection.auth.descriptionPrefix': '配置整个集合的认证方式。这适用于所有使用',
  'collection.auth.inherit': '继承',
  'collection.auth.descriptionMiddle': '选项的请求（在',
  'collection.auth.authTab': 'Auth',
  'collection.auth.descriptionSuffix': ' 标签页中）。',
  'sidebar.ignore.prefix': '忽略',
  'sidebar.ignore.hideFrom': ' 将使其从该',
  'sidebar.ignore.finalPeriod': '。',
  'workspace.remove.confirmPrefix': '确定要移除',
  'workspace.remove.confirmSuffix': ' 工作区吗？该工作区仍保留在文件系统中，可随时重新打开。',
  'environments.delete.confirmPrefix': '确定要删除',
  'environments.delete.confirmSuffix': ' 环境吗？此操作无法撤销。',
  'environments.dotEnv.confirmSuffix': ' .env 文件吗？此操作无法撤销。',
  'sidebar.closeWorkspace.confirmPrefix': '确定要关闭',
  'sidebar.closeWorkspace.confirmSuffix': ' 工作区吗？它仍保留在文件系统中的上述位置，可随时重新打开。',
  'sidebar.deleteItems.confirmExamplePrefix': '确定要删除示例'
};

// The override file's value for this key itself contains U+FFFD mojibake,
// so the en2 cross-check is skipped for it.
const EN_OVERRIDE_EXCEPTIONS = new Set(['sidebar.gitRemote.clickToClone']);

// ---------------------------------------------------------------- load data
const overrideFiles = ['en-overrides.json', 'en-overrides-2.json', 'en-overrides-3.json'];
const overrides = {};
for (const f of overrideFiles) {
  const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const [k, v] of Object.entries(o)) overrides[k] = v;
}

const enFiles = fs.readdirSync(dir).filter((f) => /^en2-group-.*\.json$/.test(f)).sort();
if (enFiles.length === 0) {
  console.error('No en2-group-*.json files found in ' + dir);
  process.exit(1);
}
const pairs = [];
for (const enFile of enFiles) {
  const zhFile = enFile.replace(/^en2-/, 'zh2-');
  const en = JSON.parse(fs.readFileSync(path.join(dir, enFile), 'utf8'));
  const zhPath = path.join(dir, zhFile);
  if (!fs.existsSync(zhPath)) {
    console.log(`FAIL  missing zh file: ${zhFile}`);
    process.exit(1);
  }
  pairs.push({ enFile, zhFile, en, zh: JSON.parse(fs.readFileSync(zhPath, 'utf8')) });
}

const zhIndex = {}; // key -> zhFile
for (const { zhFile, zh } of pairs) for (const k of Object.keys(zh)) zhIndex[k] = zhFile;
const enIndex = {};
for (const { enFile, en } of pairs) for (const k of Object.keys(en)) enIndex[k] = enFile;

// ---------------------------------------------------------------- checks
const problems = [];
const fail = (msg) => problems.push(msg);

// 1. override union coverage + revised-translation parity
let checkedOverrides = 0;
for (const [k, enVal] of Object.entries(overrides)) {
  checkedOverrides++;
  if (!(k in zhIndex)) { fail(`override key missing from zh2 files: ${k}`); continue; }
  const zhVal = pairs.find((p) => p.zhFile === zhIndex[k]).zh[k];
  if (k in EXPECT_ZH) {
    if (zhVal !== EXPECT_ZH[k]) {
      fail(`override key not updated to revised translation: ${k}\n      expected: ${JSON.stringify(EXPECT_ZH[k])}\n      actual:   ${JSON.stringify(zhVal)}`);
    }
  }
  if (!(k in enIndex) && !(k in EXPECT_ZH)) {
    fail(`override key missing from en2 files: ${k}`);
  }
  if (k in enIndex && !EN_OVERRIDE_EXCEPTIONS.has(k)) {
    const en2Val = pairs.find((p) => p.enFile === enIndex[k]).en[k];
    if (en2Val !== enVal) fail(`en2 value differs from override: ${k}`);
  }
  // placeholder parity against the NEW English
  const enP = placeholders(enVal);
  const zhP = placeholders(zhVal);
  const missingP = [...enP].filter((p) => p !== 's' && !zhP.has(p));
  const extraP = [...zhP].filter((p) => !enP.has(p));
  if (missingP.length) fail(`missing placeholders in "${k}": ${missingP.map((p) => '{{' + p + '}}').join(', ')}`);
  if (extraP.length) fail(`extra placeholders in "${k}": ${extraP.map((p) => '{{' + p + '}}').join(', ')}`);
}

// 2-6. per-pair checks
let totalKeys = 0;
for (const { enFile, zhFile, en, zh } of pairs) {
  const enKeys = Object.keys(en);
  const zhKeys = Object.keys(zh);
  totalKeys += enKeys.length;

  const missingKeys = enKeys.filter((k) => !(k in zh));
  const extraKeys = zhKeys.filter((k) => !(k in en));
  if (missingKeys.length) fail(`${zhFile}: missing keys: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? ` (+${missingKeys.length - 5} more)` : ''}`);
  if (extraKeys.length) fail(`${zhFile}: extra keys: ${extraKeys.slice(0, 5).join(', ')}${extraKeys.length > 5 ? ` (+${extraKeys.length - 5} more)` : ''}`);

  for (const k of enKeys) {
    if (!(k in zh)) continue;
    const v = zh[k];
    if (typeof v !== 'string' || v.trim().length === 0) fail(`${zhFile}: empty/non-string value: ${k}`);
    if (v.includes('\uFFFD')) fail(`${zhFile}: U+FFFD in: ${k}`);
    const enP = placeholders(en[k]);
    const zhP = placeholders(v);
    const missingP = [...enP].filter((p) => p !== 's' && !zhP.has(p));
    const extraP = [...zhP].filter((p) => !enP.has(p));
    if (missingP.length) fail(`${zhFile}: missing placeholders in "${k}": ${missingP.map((p) => '{{' + p + '}}').join(', ')}`);
    if (extraP.length) fail(`${zhFile}: extra placeholders in "${k}": ${extraP.map((p) => '{{' + p + '}}').join(', ')}`);
    if (typeof en[k] === 'string' && en[k].endsWith('...') && !v.endsWith('...')) {
      fail(`${zhFile}: trailing "..." dropped in: ${k}`);
    }
  }
}

// 7. mandated fragment values
for (const [k, expected] of Object.entries(FRAGMENTS)) {
  if (!(k in zhIndex)) { fail(`fragment key missing from zh2 files: ${k}`); continue; }
  const zhVal = pairs.find((p) => p.zhFile === zhIndex[k]).zh[k];
  if (zhVal !== expected) {
    fail(`fragment value mismatch: ${k}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(zhVal)}`);
  }
}

// ---------------------------------------------------------------- report
for (const { enFile, zhFile, en } of pairs) {
  console.log(`OK   ${enFile} -> ${zhFile}  ${Object.keys(en).length} keys, keyset parity`);
}
console.log(`\nOverride keys checked : ${checkedOverrides} (union of ${overrideFiles.join(', ')})`);
console.log(`Revised zh values pinned : ${Object.keys(EXPECT_ZH).length}`);
console.log(`Files checked : ${pairs.length}`);
console.log(`Total keys    : ${totalKeys}`);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):`);
  for (const p of problems) console.log('  - ' + p);
  console.log('\nFAILURES PRESENT');
  process.exit(1);
}
console.log('\nALL PASS');
