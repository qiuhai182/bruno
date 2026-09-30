import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import { isHttpUrl } from 'utils/url/index';
import { isOpenApiSpec } from 'utils/importers/openapi-collection';
import { parseFileAsJsonOrYaml } from 'utils/importers/file-reader';

const FEATURE_KEYS = [
  'openApiSync.connect.featureDetectEndpoints',
  'openApiSync.connect.featureTrackLocalChanges',
  'openApiSync.connect.featureSyncOneClick',
  'openApiSync.connect.featurePreserved'
];

const ConnectSpecForm = ({ sourceUrl, setSourceUrl, isLoading, error, setError, onConnect }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('url');
  const fileInputRef = useRef(null);

  return (
    <div className="setup-section">
      <div className="setup-header">
        <h2 className="setup-title">{t('openApiSync.connect.title')}</h2>
        <p className="setup-description">
          {t('openApiSync.connect.description')}
        </p>
      </div>

      <form
        className="setup-form"
        onSubmit={(e) => {
          e.preventDefault(); onConnect();
        }}
      >
        <label className="url-label">{t('openApiSync.connect.specLabel')}</label>
        <div className="url-row">
          <div className="setup-mode-toggle">
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'url' ? 'active' : ''}`}
              onClick={() => {
                setMode('url'); setSourceUrl('');
              }}
            >
              URL
            </button>
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'file' ? 'active' : ''}`}
              onClick={() => {
                setMode('file'); setSourceUrl('');
              }}
            >
              {t('openApiSync.settings.file')}
            </button>
          </div>

          {mode === 'url' ? (
            <input
              type="text"
              className="url-input"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://api.example.com/openapi.json"
            />
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  setSourceUrl('');
                  try {
                    const data = await parseFileAsJsonOrYaml(file);
                    if (!isOpenApiSpec(data)) {
                      setError(t('openApiSync.settings.invalidSpecFile'));
                      return;
                    }
                    if (data.swagger && String(data.swagger).startsWith('2')) {
                      setError(t('openApiSync.connect.swaggerNotSupported'));
                      return;
                    }
                    const filePath = window.ipcRenderer.getFilePath(file);
                    if (filePath) setSourceUrl(filePath);
                  } catch (err) {
                    setError(err.message || t('openApiSync.settings.failedToReadFile'));
                  }
                }}
              />
              <button
                type="button"
                className="url-input file-pick-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {sourceUrl ? sourceUrl.split(/[\\/]/).pop() : t('openApiSync.settings.selectFile')}
              </button>
            </>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={mode === 'url' ? !isHttpUrl(sourceUrl.trim()) : !sourceUrl.trim()}
            loading={isLoading}
          >
            {t('openApiSync.connect.button')}
          </Button>
        </div>
        <p className="setup-hint">
          {mode === 'url'
            ? t('openApiSync.connect.urlHint')
            : t('openApiSync.connect.fileHint')}
        </p>
        {error && (
          <p className="setup-error">{error}</p>
        )}
      </form>

      <div className="setup-features">
        {FEATURE_KEYS.map((key) => (
          <div className="setup-feature" key={key}>
            <IconCheck size={16} />
            <span>{t(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectSpecForm;
