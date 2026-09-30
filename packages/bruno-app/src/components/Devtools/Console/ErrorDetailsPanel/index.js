import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconX,
  IconBug,
  IconFileText,
  IconCode,
  IconStack,
  IconBrandGithub
} from '@tabler/icons';
import { clearSelectedError } from 'providers/ReduxStore/slices/logs';
import { useApp } from 'providers/App';
import platformLib from 'platform';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const ErrorInfoTab = ({ error }) => {
  const { t } = useTranslation();
  const { version } = useApp();

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const generateGitHubIssueUrl = () => {
    const title = `Bug: ${error.message.substring(0, 50)}${error.message.length > 50 ? '...' : ''}`;

    const body = `## Bug Report

### Error Details
- **Message**: ${error.message}
- **File**: ${error.filename || 'Unknown'}
- **Line**: ${error.lineno || 'Unknown'}:${error.colno || 'Unknown'}
- **Timestamp**: ${formatTimestamp(error.timestamp)}

### Environment
- **Bruno Version**: ${version}
- **OS**: ${platformLib.os.family} ${platformLib.os.version || ''}
- **Browser**: ${platformLib.name} ${platformLib.version || ''}

### Stack Trace
\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

### Arguments
\`\`\`
${error.args ? error.args.map((arg, index) => {
  if (arg && typeof arg === 'object' && arg.__type === 'Error') {
    return `[${index}]: Error: ${arg.message}`;
  }
  return `[${index}]: ${typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}`;
}).join('\n') : 'No arguments'}
\`\`\`

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior


### Additional Context

`;

    const encodedTitle = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(body);

    return `https://github.com/usebruno/bruno/issues/new?template=BLANK_ISSUE&title=${encodedTitle}&body=${encodedBody}`;
  };

  const handleReportIssue = () => {
    const url = generateGitHubIssueUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('devtools.errorDetails.errorInformation')}</h4>
        <div className="info-grid">
          <div className="info-item">
            <label>{t('devtools.errorDetails.message')}</label>
            <span className="error-message-full">{error.message || t('devtools.errorDetails.noMessage')}</span>
          </div>

          {error.filename && (
            <div className="info-item">
              <label>{t('devtools.errorDetails.file')}</label>
              <span className="file-path">{error.filename}</span>
            </div>
          )}

          {error.lineno && (
            <div className="info-item">
              <label>{t('devtools.errorDetails.line')}</label>
              <span>{error.lineno}{error.colno ? `:${error.colno}` : ''}</span>
            </div>
          )}

          <div className="info-item">
            <label>{t('devtools.errorDetails.timestamp')}</label>
            <span>{formatTimestamp(error.timestamp)}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>{t('devtools.errorDetails.reportIssue')}</h4>
        <div className="report-section">
          <p>{t('devtools.errorDetails.reportHint')}</p>
          <button
            className="report-button"
            onClick={handleReportIssue}
            title={t('devtools.errorDetails.reportTooltip')}
          >
            <IconBrandGithub size={16} strokeWidth={1.5} />
            <span>{t('devtools.errorDetails.reportButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StackTraceTab = ({ error }) => {
  const { t } = useTranslation();
  const formatStackTrace = (stack) => {
    if (!stack) return t('devtools.errorDetails.noStackTrace');

    return stack
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  };

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('devtools.errorDetails.stackTrace')}</h4>
        <div className="stack-trace-container">
          <pre className="stack-trace">
            {formatStackTrace(error.stack)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const ArgumentsTab = ({ error }) => {
  const { t } = useTranslation();
  const formatArguments = (args) => {
    if (!args || args.length === 0) return t('devtools.errorDetails.noArguments');

    try {
      return args.map((arg, index) => {
        // Handle special Error object format
        if (arg && typeof arg === 'object' && arg.__type === 'Error') {
          return `[${index}]: Error: ${arg.message}\n  Name: ${arg.name}\n  Stack: ${arg.stack || t('devtools.errorDetails.noStackTrace')}`;
        }

        if (typeof arg === 'object' && arg !== null) {
          return `[${index}]: ${JSON.stringify(arg, null, 2)}`;
        }

        return `[${index}]: ${String(arg)}`;
      }).join('\n\n');
    } catch (e) {
      return t('devtools.errorDetails.argumentsFormatError');
    }
  };

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('devtools.errorDetails.arguments')}</h4>
        <div className="arguments-container">
          <pre className="arguments">
            {formatArguments(error.args)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const ErrorDetailsPanel = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { selectedError } = useSelector((state) => state.logs);
  const [activeTab, setActiveTab] = useState('info');

  if (!selectedError) return null;

  const handleClose = () => {
    dispatch(clearSelectedError());
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <ErrorInfoTab error={selectedError} />;
      case 'stack':
        return <StackTraceTab error={selectedError} />;
      case 'args':
        return <ArgumentsTab error={selectedError} />;
      default:
        return <ErrorInfoTab error={selectedError} />;
    }
  };

  return (
    <StyledWrapper>
      <div className="panel-header">
        <div className="panel-title">
          <IconBug size={16} strokeWidth={1.5} />
          <span>{t('devtools.errorDetails.title')}</span>
          <span className="error-time">({formatTime(selectedError.timestamp)})</span>
        </div>

        <button
          className="close-button"
          onClick={handleClose}
          title={t('devtools.errorDetails.closeDetailsPanel')}
        >
          <IconX size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <IconFileText size={14} strokeWidth={1.5} />
          {t('devtools.errorDetails.tabInfo')}
        </button>

        <button
          className={`tab-button ${activeTab === 'stack' ? 'active' : ''}`}
          onClick={() => setActiveTab('stack')}
        >
          <IconStack size={14} strokeWidth={1.5} />
          {t('devtools.errorDetails.tabStack')}
        </button>

        <button
          className={`tab-button ${activeTab === 'args' ? 'active' : ''}`}
          onClick={() => setActiveTab('args')}
        >
          <IconCode size={14} strokeWidth={1.5} />
          {t('devtools.errorDetails.tabArgs')}
        </button>
      </div>

      <div className="panel-content">
        {getTabContent()}
      </div>
    </StyledWrapper>
  );
};

export default ErrorDetailsPanel;
