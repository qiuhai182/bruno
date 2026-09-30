const fs = require('fs');
const f = 'packages/bruno-app/src/components/OpenAPISyncTab/hooks/useEndpointActions.js';
let t = fs.readFileSync(f, 'utf8');
const o = "executeEndpointAction(calls, 'All changes discarded successfully', 'Failed to discard changes')";
const n = "executeEndpointAction(calls, t('openApiSync.actions.allChangesDiscarded'), t('openApiSync.actions.failedToDiscard'))";
const count = t.split(o).length - 1;
if (count !== 1) { console.log('count mismatch: ' + count); process.exit(1); }
t = t.split(o).join(n);
fs.writeFileSync(f, t, 'utf8');
console.log('fixed');
