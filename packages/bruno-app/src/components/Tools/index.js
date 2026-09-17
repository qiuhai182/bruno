import React, { useMemo, useState } from 'react';
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
        <button type="button" onClick={() => regenerate(count)}>Generate</button>
      </div>
      {items.map((uuid) => (
        <div className="tool-line" key={uuid}>
          <code>{uuid}</code>
          <button type="button" className="copy" onClick={() => navigator.clipboard?.writeText(uuid)}>copy</button>
        </div>
      ))}
    </div>
  );
};

const TimestampTool = () => {
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
    setIso(Number.isNaN(date.getTime()) ? 'invalid' : date.toISOString());
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
      <button type="button" className="mb-2" onClick={now}>Now</button>
      <label>
        <span>Epoch (seconds)</span>
        <input type="text" value={epoch} onChange={(e) => fromEpoch(e.target.value)} />
      </label>
      <label>
        <span>ISO 8601</span>
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
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const run = (mode) => {
    try {
      setOutput(mode === 'encode' ? encodeBase64(input) : decodeBase64(input));
    } catch (err) {
      setOutput(`error: ${err.message}`);
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>Input</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <button type="button" onClick={() => run('encode')}>Encode</button>
        <button type="button" onClick={() => run('decode')}>Decode</button>
      </div>
      <label>
        <span>Output</span>
        <textarea value={output} readOnly rows={4} />
      </label>
    </div>
  );
};

const UrlTool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const run = (mode) => {
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch (err) {
      setOutput(`error: ${err.message}`);
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>Input</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <button type="button" onClick={() => run('encode')}>Encode</button>
        <button type="button" onClick={() => run('decode')}>Decode</button>
      </div>
      <label>
        <span>Output</span>
        <textarea value={output} readOnly rows={4} />
      </label>
    </div>
  );
};

const JwtTool = () => {
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');

  const decode = () => {
    try {
      const parts = token.trim().split('.');
      if (parts.length < 2) {
        throw new Error('not a JWT (expected header.payload.signature)');
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
        <span>Token</span>
        <textarea value={token} onChange={(e) => setToken(e.target.value)} rows={4} />
      </label>
      <button type="button" onClick={decode}>Decode</button>
      <textarea value={result} readOnly rows={8} />
    </div>
  );
};

const RegexTool = () => {
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
          <span>Pattern</span>
          <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        </label>
        <label>
          <span>Flags</span>
          <input type="text" value={flags} onChange={(e) => setFlags(e.target.value)} />
        </label>
      </div>
      <label>
        <span>Test string</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
      </label>
      {error ? <div className="tool-error">{error}</div> : null}
      <div className="tool-line">
        <span>{matches.length} match(es)</span>
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
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState('SHA-256');
  const [output, setOutput] = useState('');

  const run = async () => {
    try {
      if (!crypto?.subtle) {
        throw new Error('WebCrypto not available in this context');
      }
      const digest = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
      setOutput(Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(''));
    } catch (err) {
      setOutput(`error: ${err.message}`);
    }
  };

  return (
    <div className="tool-body">
      <label>
        <span>Input</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      </label>
      <div className="tool-row">
        <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
          {HASH_ALGOS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button type="button" onClick={run}>Hash</button>
      </div>
      <textarea value={output} readOnly rows={3} />
    </div>
  );
};

const TOOLS = [
  { id: 'uuid', label: 'UUID', component: UuidTool },
  { id: 'timestamp', label: 'Timestamp', component: TimestampTool },
  { id: 'base64', label: 'Base64', component: Base64Tool },
  { id: 'url', label: 'URL', component: UrlTool },
  { id: 'jwt', label: 'JWT', component: JwtTool },
  { id: 'regex', label: 'Regex', component: RegexTool },
  { id: 'hash', label: 'Hash', component: HashTool }
];

const Tools = () => {
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
            {entry.label}
          </button>
        ))}
      </div>
      <ToolComponent />
    </StyledWrapper>
  );
};

export default Tools;
