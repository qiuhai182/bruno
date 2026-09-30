const fs = require('fs');
const path = 'd:/bruno/packages/bruno-app/src/components/OpenAPISyncTab/OverviewSection/index.js';
let src = fs.readFileSync(path, 'utf8');
const orig = src;

const pairs = [
  // banner useMemo: titles/subtitles -> t()
  [
    "      title: 'Failed to check for spec updates',",
    "      title: t('openApiSync.overview.failedToCheck'),"
  ],
  [
    "      title: 'Initial sync required \u2014 your collection differs from the spec',",
    "      title: t('openApiSync.overview.initialSyncRequired'),"
  ],
  [
    "      subtitle: 'Review the changes and sync to bring your collection up to date.',",
    "      subtitle: t('openApiSync.overview.initialSyncSubtitle'),"
  ],
  [
    "      title: `OpenAPI spec has new updates${versionInfo} and the collection has changes`,",
    "      title: t('openApiSync.overview.specUpdatesAndCollectionChanges', { versionInfo }),"
  ],
  [
    "      subtitle: 'New or changed requests are available. Some collection changes may be overwritten.',",
    "      subtitle: t('openApiSync.overview.someOverwrittenSubtitle'),"
  ],
  [
    "      title: `OpenAPI spec has new updates${versionInfo}`,",
    "      title: t('openApiSync.overview.specHasNewUpdates', { versionInfo }),"
  ],
  [
    "      subtitle: 'New or changed requests are available.',",
    "      subtitle: t('openApiSync.overview.newRequestsAvailable'),"
  ],
  [
    "      title: 'Last synced spec not found',",
    "      title: t('openApiSync.overview.lastSyncedSpecNotFound'),"
  ],
  [
    "      subtitle: 'The last synced spec is missing in the storage. Restore the latest spec from the source to track collection changes.',",
    "      subtitle: t('openApiSync.overview.restoreToTrackSubtitle'),"
  ],
  [
    "      title: 'Collection has changes not in the spec',",
    "      title: t('openApiSync.overview.collectionHasChanges'),"
  ],
  [
    "      subtitle: 'Some requests have been modified or removed and no longer match the spec.',",
    "      subtitle: t('openApiSync.overview.noLongerMatchSubtitle'),"
  ],
  // useMemo deps: add t
  [
    "  }, [activeError, hasDriftData, hasSpecUpdates, hasCollectionChanges, specDrift?.storedSpecMissing, specDrift?.storedVersion, specDrift?.newVersion, lastSyncDate]);",
    "  }, [activeError, hasDriftData, hasSpecUpdates, hasCollectionChanges, specDrift?.storedSpecMissing, specDrift?.storedVersion, specDrift?.newVersion, lastSyncDate, t]);"
  ],
  // banner JSX buttons
  [
    "                >\n                  View Collection Changes\n                </Button>",
    "                >\n                  {t('openApiSync.overview.viewCollectionChanges')}\n                </Button>"
  ],
  [
    "                <Button size=\"sm\" onClick={() => onTabSelect('spec-updates')}>\n                  Review and Sync Collection\n                </Button>",
    "                <Button size=\"sm\" onClick={() => onTabSelect('spec-updates')}>\n                  {t('openApiSync.overview.reviewAndSync')}\n                </Button>"
  ],
  [
    "                <Button variant=\"outline\" size=\"sm\" onClick={() => onTabSelect('spec-updates')}>\n                  Go to Spec Updates\n                </Button>",
    "                <Button variant=\"outline\" size=\"sm\" onClick={() => onTabSelect('spec-updates')}>\n                  {t('openApiSync.overview.goToSpecUpdates')}\n                </Button>"
  ],
  [
    "                <Button variant=\"outline\" size=\"sm\" onClick={onOpenSettings}>\n                  Update connection settings\n                </Button>",
    "                <Button variant=\"outline\" size=\"sm\" onClick={onOpenSettings}>\n                  {t('openApiSync.banner.updateConnectionSettings')}\n                </Button>"
  ],
  // section titles
  [
    "<h4 className=\"overview-section-title mt-5\">Endpoint Summary</h4>",
    "<h4 className=\"overview-section-title mt-5\">{t('openApiSync.overview.endpointSummary')}</h4>"
  ],
  [
    "<h4 className=\"overview-section-title mt-7\">Last Synced Spec Details</h4>",
    "<h4 className=\"overview-section-title mt-7\">{t('openApiSync.overview.lastSyncedSpecDetails')}</h4>"
  ],
  // summary cards map: labelKey/tooltipKey
  [
    "        {SUMMARY_CARDS.map(({ key, label, tooltip, tab, color }) => {\n          const count = summaryValues[key];",
    "        {SUMMARY_CARDS.map(({ key, labelKey, tooltipKey, tab, color }) => {\n          const count = summaryValues[key];\n          const label = t(labelKey);\n          const tooltip = t(tooltipKey);"
  ],
  // conflict annotation
  [
    "                  <span className=\"conflict-annotation\">({conflictCount} {conflictCount === 1 ? 'conflict' : 'conflicts'})</span>",
    "                  <span className=\"conflict-annotation\">{t('openApiSync.overview.conflictCount', { count: conflictCount, s: conflictCount === 1 ? '' : 's' })}</span>"
  ]
];

let miss = 0;
for (const [from, to] of pairs) {
  if (!src.includes(from)) {
    console.log('MISS: ' + from.slice(0, 90).replace(/\n/g, '\\n'));
    miss++;
    continue;
  }
  src = src.replace(from, to);
}
if (miss === 0) {
  fs.writeFileSync(path, src, 'utf8');
  console.log('OK: ' + pairs.length + ' replacements applied');
} else {
  console.log('ABORTED: ' + miss + ' misses, file NOT written');
}
