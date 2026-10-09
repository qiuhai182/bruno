#!/usr/bin/env node
/**
 * Applies the revised-English (override) translations to zh2-group-*.json files.
 * - Updates zh values whose English source was revised (old zh may be stale/garbage).
 * - Adds 5 override-only keys missing from both en2/z2 group files (4x requestPane.auth.*,
 *   sidebar.changeVersion.into) to BOTH the zh2 and en2 files so key-set parity is kept.
 * Preserves: key order, 2-space indent, LF, no BOM, per-file trailing newline.
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// ---------------------------------------------------------------- zh updates
const zhUpdates = {
  'zh2-group-collection.json': {
    // task-specified 5-fragment composition:
    // prefix + <inherit> + middle + <authTab> + suffix
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
    'collection.proxy.inherit': '继承'
  },
  'zh2-group-devtools.json': {
    'devtools.performance.currentCpu': '当前 CPU 占用',
    'devtools.performance.currentMemory': '当前内存占用',
    'devtools.performance.processPid': '进程 PID',
    'devtools.requestDetails.noHeaders': '无标头',
    'devtools.requestDetails.noNetworkLogs': '无网络日志',
    'devtools.requestDetails.noResponseData': '无响应数据',
    'devtools.terminal.loadingSessions': '正在加载会话...',
    'devtools.terminal.noActiveSessions': '无活动会话'
  },
  'zh2-group-environments.json': {
    'environments.delete.confirmSuffix': ' 环境吗？此操作无法撤销。',
    'environments.dotEnv.confirmSuffix': ' .env 文件吗？此操作无法撤销。',
    'environments.inheritance.circular': '检测到循环继承：{{path}}',
    'environments.validation.alreadyExists': '已存在同名环境',
    'environments.validation.globalAlreadyExists': '已存在同名的全局环境'
  },
  'zh2-group-notifications.json': {
    'notifications.menuAriaLabel': '打开通知菜单'
  },
  'zh2-group-preferences.json': {
    'preferences.ai.autocomplete.triggerAria': '触发模式'
  },
  'zh2-group-requestPane.json': {
    'requestPane.errorOccurred': '发生错误！',
    'requestPane.grpc.errorOccurred': '发生错误！',
    'requestPane.grpc.noAuth': '无认证',
    'requestPane.ws.errorOccurred': '发生错误！',
    'requestPane.ws.noAuth': '无认证',
    'requestPane.queryBuilder.failedToLoadSchema': '加载 Schema 失败',
    'requestPane.queryBuilder.noSchemaLoaded': '未加载 Schema',
    'requestPane.queryBuilder.somethingWentWrong': '出了点问题',
    // override-only keys, added (kept in sync with collection.auth.* fragments)
    'requestPane.auth.authTab': 'Auth',
    'requestPane.auth.descriptionMiddle': '选项的请求（在',
    'requestPane.auth.descriptionSuffix': ' 标签页中）。',
    'requestPane.auth.inherit': '继承'
  },
  'zh2-group-sidebar.json': {
    'sidebar.bulkImport.groupingTags': '标签',
    'sidebar.bulkImport.groupingTagsDesc': '按 OpenAPI/Swagger 标签对请求分组',
    'sidebar.changeVersion.collectionLabel': '集合：',
    'sidebar.changeVersion.title': '更改集合版本',
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
    // task-specified postmanReport composition:
    // prefix + <pkg list> + mid + <safeMode> + suffix
    'sidebar.postmanReport.customPackagesPrefix': '自定义 npm 包（例如 ',
    'sidebar.postmanReport.customPackagesMid': '）已安装，但该集合目前正在以',
    'sidebar.postmanReport.safeMode': '安全模式',
    'sidebar.postmanReport.customPackagesSuffix': '运行。',
    // ignore composition: prefix + <item name> + hideFrom + <format name> + finalPeriod
    'sidebar.ignore.prefix': '忽略',
    'sidebar.ignore.hideFrom': ' 将使其从该',
    'sidebar.ignore.finalPeriod': '。',
    'sidebar.closeWorkspace.confirmSuffix': ' 工作区吗？它仍保留在文件系统中的上述位置，可随时重新打开。',
    // override-only key (code currently uses sidebar.changeVersion.in)
    'sidebar.changeVersion.into': '位于'
  },
  'zh2-group-workspace.json': {
    'workspace.remove.confirmSuffix': ' 工作区吗？该工作区仍保留在文件系统中，可随时重新打开。'
  }
};

// ---------------------------------------------------------------- en additions
const enAdditions = {
  'en2-group-requestPane.json': {
    after: 'requestPane.auth.addTo',
    entries: {
      'requestPane.auth.authTab': 'Auth',
      'requestPane.auth.descriptionMiddle': 'option in the',
      'requestPane.auth.descriptionSuffix': 'tab.',
      'requestPane.auth.inherit': 'Inherit'
    }
  },
  'en2-group-sidebar.json': {
    after: 'sidebar.changeVersion.in',
    entries: {
      'sidebar.changeVersion.into': 'in'
    }
  }
};

// zh additions share the same anchors as their en2 counterparts
const zhAdditionAnchors = {
  'zh2-group-requestPane.json': 'requestPane.auth.addTo',
  'zh2-group-sidebar.json': 'sidebar.changeVersion.in'
};

function rewrite(file, updates, additionAnchor, additions) {
  const p = path.join(dir, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.startsWith('\uFEFF')) throw new Error(`${file}: unexpected BOM`);
  const trailingNl = /\n$/.test(src);
  const obj = JSON.parse(src);
  const next = {};
  let updated = 0;
  let added = 0;
  let anchorSeen = false;
  for (const k of Object.keys(obj)) {
    next[k] = (updates && updates[k] !== undefined && updates[k] !== obj[k]) ? (updated++, updates[k]) : obj[k];
    if (k === additionAnchor) {
      anchorSeen = true;
      for (const [nk, nv] of Object.entries(additions || {})) {
        next[nk] = nv; added++;
      }
    }
  }
  if (additionAnchor && !anchorSeen) throw new Error(`${file}: anchor "${additionAnchor}" not found`);
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + (trailingNl ? '\n' : ''), 'utf8');
  return { updated, added };
}

let totalUpdated = 0;
let totalAddedZh = 0;
let totalAddedEn = 0;

for (const [file, updates] of Object.entries(zhUpdates)) {
  const anchor = zhAdditionAnchors[file];
  const additions = anchor
    ? Object.fromEntries(Object.entries(updates).filter(([k]) => !Object.keys(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))).includes(k)))
    : undefined;
  const r = rewrite(file, updates, anchor, additions);
  totalUpdated += r.updated;
  totalAddedZh += r.added;
  console.log(`${file}: ${r.updated} value(s) updated, ${r.added} key(s) added`);
}

for (const [file, spec] of Object.entries(enAdditions)) {
  const r = rewrite(file, null, spec.after, spec.entries);
  totalAddedEn += r.added;
  console.log(`${file}: ${r.added} key(s) added`);
}

console.log(`\nTotal zh values updated: ${totalUpdated}`);
console.log(`Total zh keys added:     ${totalAddedZh}`);
console.log(`Total en keys added:     ${totalAddedEn}`);
