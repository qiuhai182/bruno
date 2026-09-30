import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconCircleCheck,
  IconCode,
  IconCopy,
  IconLoader2,
  IconPackage,
  IconShieldLock,
  IconTerminal2
} from '@tabler/icons';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import { saveCollectionSecurityConfig } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByPathname } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const PackageList = ({ items }) => (
  <ul className="pkg-list">
    {items.map((name) => (
      <li key={name} className="pkg-list-item">
        <IconPackage size={12} strokeWidth={1.75} />
        <span>{name}</span>
      </li>
    ))}
  </ul>
);

// Renders "`a` and `b`" / "`a`, `b` and `c`" / "`a`, `b` and 3 more" as inline
// code spans for use inside a sentence.
const renderPackageExamples = (names = [], t) => {
  const shown = names.slice(0, 3);
  const remainder = names.length - shown.length;
  return shown.map((name, idx) => {
    let separator = '';
    if (idx > 0) {
      separator = idx === shown.length - 1 && remainder === 0 ? ` ${t('sidebar.postmanReport.and')} ` : ', ';
    }
    return (
      <Fragment key={name}>
        {separator}
        <code>{name}</code>
        {idx === shown.length - 1 && remainder > 0 ? ` ${t('sidebar.postmanReport.andMore', { count: remainder })}` : ''}
      </Fragment>
    );
  });
};

// Maps an install result's errorCode to a user-facing message. Falls back to a
// generic exit-code message for plain non-zero exits.
const getInstallFailureMessage = (result, t) => {
  switch (result?.errorCode) {
    case 'NPM_NOT_FOUND':
      return t('sidebar.postmanReport.npmNotFound');
    case 'TIMEOUT':
      return t('sidebar.postmanReport.npmTimeout');
    case 'SPAWN_FAILED':
    case 'SPAWN_ERROR':
      return t('sidebar.postmanReport.spawnFailed');
    default:
      return t('sidebar.postmanReport.installFailedExitCode', { exitCode: result?.exitCode });
  }
};

const PostmanPackageReport = ({ report, collectionPath, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const collections = useSelector((state) => state.collections.collections);
  const collection = useMemo(
    () => findCollectionByPathname(collections, collectionPath),
    [collections, collectionPath]
  );
  const sandboxMode = collection?.securityConfig?.jsSandboxMode || 'safe';
  const isDeveloperMode = sandboxMode === 'developer';

  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState(null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const needsInstall = report?.needsInstall || [];
  const unsupported = report?.unsupported || [];
  const devMode = report?.devMode || [];

  const installCommand = useMemo(
    () => (needsInstall.length ? `npm install --save ${needsInstall.join(' ')}` : ''),
    [needsInstall]
  );

  const needsDevModeOnly
    = needsInstall.length === 0 && devMode.length > 0 && !isDeveloperMode;
  const hasActionable
    = needsInstall.length > 0 || unsupported.length > 0 || needsDevModeOnly;

  useEffect(() => {
    if (report && !hasActionable) onClose();
  }, [report, hasActionable, onClose]);

  if (!report || !hasActionable) return null;

  const installDone = installResult && installResult.success;
  const installFailed = installResult && !installResult.success;
  const installFailureMessage = installFailed ? getInstallFailureMessage(installResult, t) : '';

  const handleInstall = async () => {
    if (!collectionPath) {
      toast.error(t('sidebar.postmanReport.errorNoCollectionPath'));
      return;
    }
    if (needsInstall.length === 0) return;

    setInstalling(true);
    setInstallResult(null);
    try {
      const result = await window.ipcRenderer.invoke(
        'renderer:install-postman-packages',
        collectionPath,
        needsInstall
      );
      setInstallResult(result);
      if (result.success) {
        toast.success(
          needsInstall.length === 1
            ? t('sidebar.postmanReport.installedOne', { count: needsInstall.length })
            : t('sidebar.postmanReport.installedMany', { count: needsInstall.length })
        );
      } else {
        toast.error(t('sidebar.postmanReport.installFailedSeeDetails'));
      }
    } catch (err) {
      console.error('Install failed:', err);
      setInstallResult({ success: false, stderr: err?.message || String(err), exitCode: -1 });
      toast.error(t('sidebar.postmanReport.failedToStartInstall'));
    } finally {
      setInstalling(false);
    }
  };

  const handleSwitchToDeveloperMode = () => {
    if (!collection?.uid) {
      toast.error(t('sidebar.postmanReport.couldNotLocateCollection'));
      return;
    }
    setSwitchingMode(true);
    dispatch(saveCollectionSecurityConfig(collection.uid, { jsSandboxMode: 'developer' }))
      .then(() => toast.success(t('sidebar.postmanReport.developerModeEnabled')))
      .catch((err) => {
        console.error(err);
        toast.error(t('sidebar.postmanReport.failedToSwitchSandboxMode'));
      })
      .finally(() => setSwitchingMode(false));
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('sidebar.postmanReport.copyFailed'));
    }
  };

  const isDismissAction = installDone || needsInstall.length === 0;
  const confirmText = installDone
    ? t('sidebar.postmanReport.done')
    : installing
      ? t('sidebar.postmanReport.installing')
      : needsInstall.length > 0
        ? (needsInstall.length === 1 ? t('sidebar.postmanReport.installOne', { count: needsInstall.length }) : t('sidebar.postmanReport.installMany', { count: needsInstall.length }))
        : t('sidebar.postmanReport.done');
  const handleConfirm = isDismissAction ? onClose : handleInstall;

  return (
    <StyledWrapper>
      <Modal
        size="md"
        title={t('sidebar.postmanReport.title')}
        confirmText={confirmText}
        cancelText={t('sidebar.postmanReport.skip')}
        hideCancel={installDone || (needsInstall.length === 0 && !installFailed)}
        confirmDisabled={installing}
        confirmButtonColor={isDismissAction ? 'secondary' : 'primary'}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        dataTestId="postman-package-report-modal"
        disableCloseOnOutsideClick
      >
        {needsInstall.length > 0 && (
          <div className="pkg-section">
            <div className="pkg-section-head">
              <span className="pkg-section-title">{t('sidebar.postmanReport.packagesUsedInScripts')}</span>
              <span className="pkg-section-count">{needsInstall.length}</span>
            </div>
            {!installing && !installDone && (
              <p className="pkg-section-help">
                {t('sidebar.postmanReport.packagesNotInstalledHelp')}
              </p>
            )}
            <PackageList items={needsInstall} />

            {!installing && !installDone && (
              <div className="pkg-cmd-block">
                <div className="pkg-cmd-label">
                  <IconTerminal2 size={12} strokeWidth={1.75} />
                  <span>{t('sidebar.postmanReport.orInstallManually')}</span>
                </div>
                <div className="pkg-cmd-row">
                  <code className="pkg-cmd-code">{installCommand}</code>
                  <button
                    type="button"
                    className="pkg-cmd-copy"
                    onClick={handleCopyCommand}
                    aria-label={t('sidebar.postmanReport.copyCommand')}
                  >
                    {copied ? <IconCheck size={14} strokeWidth={1.75} /> : <IconCopy size={14} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
            )}

            {installing && (
              <div className="pkg-inline-status pkg-inline-info">
                <IconLoader2 size={14} strokeWidth={1.75} className="pkg-spin" />
                <span>{needsInstall.length === 1 ? t('sidebar.postmanReport.installingOne', { count: needsInstall.length }) : t('sidebar.postmanReport.installingMany', { count: needsInstall.length })}</span>
              </div>
            )}

            {installDone && (
              <div className="pkg-inline-status pkg-inline-success">
                <IconCircleCheck size={14} strokeWidth={1.75} />
                <span>
                  {(installResult.installed || needsInstall).length === 1
                    ? t('sidebar.postmanReport.installedIntoOne', { count: (installResult.installed || needsInstall).length })
                    : t('sidebar.postmanReport.installedIntoMany', { count: (installResult.installed || needsInstall).length })}
                </span>
              </div>
            )}
          </div>
        )}

        {needsDevModeOnly && !installDone && !installing && (
          <div className="pkg-section pkg-devmode">
            <div className="pkg-devmode-head">
              <IconAlertTriangle size={18} strokeWidth={1.75} />
              <span className="pkg-devmode-title">{t('sidebar.postmanReport.devModeTitle')}</span>
            </div>
            <p className="pkg-devmode-desc">
              {t('sidebar.postmanReport.devModeDescPrefix')}
              {renderPackageExamples(devMode, t)}
              {t('sidebar.postmanReport.devModeDescMid')}
              <strong>{t('sidebar.postmanReport.developerMode')}</strong>
              {t('sidebar.postmanReport.devModeDescSuffix')}
            </p>
            <PackageList items={devMode} />
            <div className="pkg-devmode-trust">
              <IconShieldLock size={15} strokeWidth={1.75} />
              <span>{t('sidebar.postmanReport.onlyEnableForTrusted')}</span>
            </div>
            <Button
              color="primary"
              size="sm"
              loading={switchingMode}
              icon={<IconCode size={15} strokeWidth={2} />}
              onClick={handleSwitchToDeveloperMode}
              data-testid="switch-to-developer-mode"
            >
              {t('sidebar.postmanReport.switchToDeveloperMode')}
            </Button>
          </div>
        )}

        {unsupported.length > 0 && !installDone && !installing && (
          <div className="pkg-section pkg-section-danger">
            <div className="pkg-section-head">
              <IconBan size={14} strokeWidth={1.75} />
              <span className="pkg-section-title">{t('sidebar.postmanReport.notSupportedTitle')}</span>
              <span className="pkg-section-count">{unsupported.length}</span>
            </div>
            <p className="pkg-section-help">
              {t('sidebar.postmanReport.notSupportedHelp')}
            </p>
            <PackageList items={unsupported} />
          </div>
        )}

        {installDone && (
          isDeveloperMode ? (
            <div className="pkg-status pkg-status-success">
              <IconCircleCheck size={14} strokeWidth={1.75} />
              <span>
                {t('sidebar.postmanReport.runsInDevModePrefix')}
                <strong>{t('sidebar.postmanReport.developerMode')}</strong>
                {t('sidebar.postmanReport.runsInDevModeSuffix')}
              </span>
            </div>
          ) : (
            <div className="pkg-section pkg-devmode">
              <div className="pkg-devmode-head">
                <IconAlertTriangle size={18} strokeWidth={1.75} />
                <span className="pkg-devmode-title">{t('sidebar.postmanReport.externalModulesTitle')}</span>
              </div>
              <p className="pkg-devmode-desc">
                {t('sidebar.postmanReport.customPackagesPrefix')}
                {renderPackageExamples(installResult.installed || needsInstall, t)}
                {t('sidebar.postmanReport.customPackagesMid')}
                <strong>{t('sidebar.postmanReport.safeMode')}</strong>
                {t('sidebar.postmanReport.customPackagesSuffix')}
              </p>
              <div className="pkg-devmode-trust">
                <IconShieldLock size={15} strokeWidth={1.75} />
                <span>{t('sidebar.postmanReport.onlyEnableForTrusted')}</span>
              </div>
              <Button
                color="primary"
                size="sm"
                loading={switchingMode}
                icon={<IconCode size={15} strokeWidth={2} />}
                onClick={handleSwitchToDeveloperMode}
                data-testid="switch-to-developer-mode"
              >
                {t('sidebar.postmanReport.switchToDeveloperMode')}
              </Button>
            </div>
          )
        )}

        {installFailed && (
          <div className="pkg-status pkg-status-danger" data-testid="postman-package-install-error">
            <div className="pkg-status-head">
              <IconAlertTriangle size={14} strokeWidth={1.75} />
              <span>{installFailureMessage}</span>
            </div>
            {(installResult.stderr || installResult.stdout) && (
              <pre className="pkg-status-log">
                {(installResult.stderr || installResult.stdout).slice(-1200)}
              </pre>
            )}
          </div>
        )}
      </Modal>
    </StyledWrapper>
  );
};

export default PostmanPackageReport;
