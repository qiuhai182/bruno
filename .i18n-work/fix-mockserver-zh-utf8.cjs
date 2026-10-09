const fs = require('fs');
const P = 'd:/bruno/.i18n-work/batch-mockserver-keys.zh.json';
// "正在加载集合..." as unicode escapes (script stays pure ASCII)
const EXPECT = '\u6b63\u5728\u52a0\u8f7d\u96c6\u5408...';
const SERVER = '\u670d'; // fu
const dec = new TextDecoder('gbk');
let attempts = 0;
let doneFlag = false;

function finish(ok, msg) {
  if (doneFlag) return;
  doneFlag = true;
  clearInterval(timer);
  console.log(msg);
  process.exit(ok ? 0 : 1);
}

const timer = setInterval(() => {
  attempts++;
  if (attempts > 30) {
    finish(false, 'FAILED: content never stabilized after 30 attempts');
    return;
  }
  try {
    const buf = fs.readFileSync(P);
    const rawUtf8 = buf.toString('utf8');

    // Case 1: already clean UTF-8 with the expected fresh value -> done
    if (!rawUtf8.includes('\uFFFD')) {
      try {
        const obj = JSON.parse(rawUtf8);
        if (obj['mockServer.create.loadingCollection'] === EXPECT && Object.keys(obj).length === 255) {
          finish(true, 'ALREADY CLEAN after ' + attempts + ' checks');
          return;
        }
      } catch (e) { /* fall through */ }
    }

    // Case 2: file holds GBK bytes of the intended UTF-8 content -> decode back and rewrite
    const text = dec.decode(buf);
    if (text.includes('\uFFFD')) {
      throw new Error('GBK decode still yields FFFD');
    }
    const obj = JSON.parse(text);
    if (obj['mockServer.create.loadingCollection'] !== EXPECT) {
      throw new Error('stale content (loadingCollection mismatch), write not landed yet');
    }
    if (Object.keys(obj).length !== 255) {
      throw new Error('unexpected key count ' + Object.keys(obj).length);
    }
    if (!obj['mockServer.dashboard.startedAt'].includes(SERVER)) {
      throw new Error('no CJK after decode');
    }
    fs.writeFileSync(P, text, 'utf8');
    const back = fs.readFileSync(P, 'utf8');
    if (back.includes('\uFFFD')) {
      throw new Error('rewritten file re-read has FFFD');
    }
    finish(true, 'FIXED and rewritten as UTF-8 after ' + attempts + ' attempts');
  } catch (err) {
    console.log('attempt ' + attempts + ': ' + err.message);
  }
}, 2000);
