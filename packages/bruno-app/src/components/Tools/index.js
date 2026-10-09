import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const UuidTool = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState(1);
  const [items, setItems] = useState([generateUuid()]);

  const regenerate = (n) => {
    const parsed = Math.max(1, Math.min(20, Number(n) || 1));
    setCount(parsed);
    setItems(Array.from({ length: parsed }, generateUuid));
  };

  return (
    <div className="tool-body">
      <div className="tool-row">
        <input type="text" value={count} onChange={(e) => setCount(e.target.value)} />
        <button type="button" onClick={() => regenerate(count)}>{t('tools.generate')}</button>
      </div>
      {items.map((uuid) => (
        <div className="tool-line" key={uuid}>
          <code>{uuid}</code>
          <button type="button" className="copy" onClick={() => navigator.clipboard?.writeText(uuid)}>{t('tools.copy')}</button>
        </div>
      ))}
    </div>
  );
};

const TimestampTool = () => {
  const { t } = useTranslation();
  const [epoch, setEpoch] = useState('');
  const [iso, setIso] = useState('');

  const now = () => {
    setEpoch(String(Math.floor(Date.now() / 1000)));
    setIso(new Date().toISOString());
  };

  const fromEpoch = (value) => {
    setEpoch(value);
    const num = Number(value);
    if (!value || Number.isNaN(num)) {
      setIso('');
      return;
    }
    // treat < 10^12 as seconds, otherwise milliseconds
    const date = new Date(Math.abs(num) < 1e12 ? num * 1000 : num);
    setIso(Number.isNaN(date.getTime()) ? t('tools.invalid') : date.toISOString());
  };

  const fromIso = (value) => {
    setIso(value);
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) {
      setEpoch('');
      return;
    }
    setEpoch(String(Math.floor(date.getTime() / 1000)));
  };

  return (
    <div className="tool-body">
      <button type="button" className="mb-2" onClick={now}>{t('tools.now')}</button>
      <label>
        <span>{t('tools.epochSeconds')}</span>
        <input type="text" value={epoch} onChange={(e) => fromEpoch(e.target.value)} />
      </label>
      <label>
        <span>{t('tools.iso8601')}</span>
        <input type="text" value={iso} onChange={(e) => fromIso(e.target.value)} />
      </label>
    </div>
  );
};

const encodeBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const decodeBase64 = (base64) => {
  const binary = atob(base64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const Base64Tool = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const run = (mode) => {
    try {
      setOutput(mode === 'encode' ? encodeBase64(input) : decodeBase64(input));
    } catch (err) {
      setOutput(t('tools.errorPrefix', { message: err.message }));
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>{t('tools.input')}</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <button type="button" onClick={() => run('encode')}>{t('tools.encode')}</button>
        <button type="button" onClick={() => run('decode')}>{t('tools.decode')}</button>
      </div>
      <label>
        <span>{t('tools.output')}</span>
        <textarea value={output} readOnly rows={4} />
      </label>
    </div>
  );
};

const UrlTool = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const run = (mode) => {
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch (err) {
      setOutput(t('tools.errorPrefix', { message: err.message }));
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>{t('tools.input')}</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <button type="button" onClick={() => run('encode')}>{t('tools.encode')}</button>
        <button type="button" onClick={() => run('decode')}>{t('tools.decode')}</button>
      </div>
      <label>
        <span>{t('tools.output')}</span>
        <textarea value={output} readOnly rows={4} />
      </label>
    </div>
  );
};

const JwtTool = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');

  const decode = () => {
    try {
      const parts = token.trim().split('.');
      if (parts.length < 2) {
        throw new Error(t('tools.notJwt'));
      }
      const fromBase64Url = (part) => decodeBase64(part.replace(/-/g, '+').replace(/_/g, '/'));
      const header = JSON.parse(fromBase64Url(parts[0]));
      const payload = JSON.parse(fromBase64Url(parts[1]));
      setResult(JSON.stringify({ header, payload }, null, 2));
    } catch (err) {
      setResult(`error: ${err.message}`);
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>{t('tools.token')}</span>
        <textarea value={token} onChange={(e) => setToken(e.target.value)} rows={4} />
      </label>
      <button type="button" onClick={decode}>{t('tools.decode')}</button>
      <textarea value={result} readOnly rows={8} />
    </div>
  );
};

const RegexTool = () => {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    setError('');
    if (!pattern || !text) {
      return [];
    }
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
      return Array.from(text.matchAll(regex), (m) => ({ match: m[0], index: m.index }));
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [pattern, flags, text]);

  return (
    <div className="tool-body">
      <div className="tool-row">
        <label className="grow">
          <span>{t('tools.pattern')}</span>
          <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        </label>
        <label>
          <span>{t('tools.flags')}</span>
          <input type="text" value={flags} onChange={(e) => setFlags(e.target.value)} />
        </label>
      </div>
      <label>
        <span>{t('tools.testString')}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
      </label>
      {error ? <div className="tool-error">{error}</div> : null}
      <div className="tool-line">
        <span>{t('tools.matches', { count: matches.length, s: matches.length === 1 ? '' : 's' })}</span>
      </div>
      {matches.slice(0, 50).map((entry, i) => (
        <div className="tool-line" key={i}>
          <code>{entry.match}</code>
          <span className="muted">@{entry.index}</span>
        </div>
      ))}
    </div>
  );
};

const HASH_ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const HashTool = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState('SHA-256');
  const [output, setOutput] = useState('');

  const run = async () => {
    try {
      if (!crypto?.subtle) {
        throw new Error(t('tools.webCryptoUnavailable'));
      }
      const digest = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
      setOutput(Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(''));
    } catch (err) {
      setOutput(t('tools.errorPrefix', { message: err.message }));
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>{t('tools.input')}</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
          {HASH_ALGOS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button type="button" onClick={run}>{t('tools.hash')}</button>
      </div>
      <textarea value={output} readOnly rows={3} />
    </div>
  );
};

const TOOLS = [
  { id: 'uuid', labelKey: 'tools.tab.uuid', component: UuidTool },
  { id: 'timestamp', labelKey: 'tools.tab.timestamp', component: TimestampTool },
  { id: 'base64', labelKey: 'tools.tab.base64', component: Base64Tool },
  { id: 'url', labelKey: 'tools.tab.url', component: UrlTool },
  { id: 'jwt', labelKey: 'tools.tab.jwt', component: JwtTool },
  { id: 'regex', labelKey: 'tools.tab.regex', component: RegexTool },
  { id: 'hash', labelKey: 'tools.tab.hash', component: HashTool }
];

const Tools = () => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState('uuid');
  const tool = TOOLS.find((entry) => entry.id === activeTool) || TOOLS[0];
  const ToolComponent = tool.component;

  return (
    <StyledWrapper>
      <div className="tools-tabs">
        {TOOLS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === tool.id ? 'active' : ''}
            onClick={() => setActiveTool(entry.id)}
          >
            {t(entry.labelKey)}
          </button>
        ))}
      </div>
      <ToolComponent />
    </StyledWrapper>
  );
};

export default Tools;
