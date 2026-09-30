import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  IconCopy,
  IconDotsVertical,
  IconUnlink,
  IconSettings,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle
} from '@tabler/icons';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon/index';
import MenuDropdown from 'ui/MenuDropdown';
import Help from 'components/Help';
import { isHttpUrl } from 'utils/url/index';

const OpenAPISyncHeader = ({
  collection, spec, sourceUrl, syncStatus, onViewSpec,
  onOpenSettings, onOpenDisconnect,
  onCheck, isLoading
}) => {
  const { t } = useTranslation();
  const sourceIsLocal = !isHttpUrl(sourceUrl);
  const canCheck = !!sourceUrl?.trim();

  // Resolve relative file paths to absolute for display
  const [displayPath, setDisplayPath] = useState(sourceUrl);
  useEffect(() => {
    if (sourceIsLocal && sourceUrl) {
      window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname)
        .then((resolved) => setDisplayPath(resolved))
        .catch(() => setDisplayPath(sourceUrl));
    } else {
      setDisplayPath(sourceUrl);
    }
  }, [sourceUrl, sourceIsLocal, collection.pathname]);

  const specMeta = useSelector((state) => state.openapiSync?.storedSpecMeta?.[collection.uid] || null);
  const title = specMeta?.title || spec?.info?.title || t('openApiSync.header.unknownApi');

  const copyUrl = async () => {
    if (!sourceUrl) return;
    try {
      if (sourceIsLocal) {
        const absolutePath = await window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname);
        await navigator.clipboard.writeText(absolutePath);
      } else {
        await navigator.clipboard.writeText(sourceUrl);
      }
      toast.success(sourceIsLocal ? t('openApiSync.header.pathCopied') : t('openApiSync.header.urlCopied'));
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error(t('openApiSync.header.copyFailed'));
    }
  };

  const revealInFolder = async () => {
    if (!sourceUrl) return;
    try {
      const absolutePath = await window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname);
      await window.ipcRenderer.invoke('renderer:show-in-folder', absolutePath);
    } catch (err) {
      console.error('Error revealing in folder:', err);
      toast.error(t('openApiSync.header.openInFileManagerFailed'));
    }
  };

  const menuItems = [
    {
      id: 'settings',
      label: t('openApiSync.header.editConnectionSettings'),
      leftSection: IconSettings,
      onClick: onOpenSettings
    },
    {
      id: 'disconnect',
      label: t('openApiSync.disconnect.title'),
      leftSection: IconUnlink,
      className: 'delete-item',
      onClick: onOpenDisconnect
    }
  ];

  return (
    <div className="spec-info-card">
      <div className="spec-info-header">
        <div className="spec-title-section">
          <div className="spec-title-row">
            <span className="spec-title">{title}</span>
          </div>
        </div>
        <div className="spec-header-actions">
          <Button
            color="secondary"
            size="sm"
            onClick={onCheck}
            disabled={!canCheck}
            loading={isLoading}
            icon={<IconRefresh size={14} />}
          >
            {t('openApiSync.header.checkForUpdates')}
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={onViewSpec}
          >
            {t('openApiSync.header.viewSpec')}
          </Button>
          <MenuDropdown items={menuItems} placement="bottom-end">
            <ActionIcon label={t('openApiSync.header.moreOptions')}>
              <IconDotsVertical size={16} strokeWidth={2} />
            </ActionIcon>
          </MenuDropdown>
        </div>
      </div>
      <div className="spec-url-row">
        <span className="spec-url-label">{sourceIsLocal ? t('openApiSync.header.sourceFile') : t('openApiSync.header.sourceUrl')}</span>
        {sourceIsLocal ? (
          <button
            className="spec-url-value spec-file-reveal"
            title={t('openApiSync.header.revealInFileManager')}
            type="button"
            onClick={revealInFolder}
          >
            {displayPath}
          </button>
        ) : (
          <a
            className="spec-url-value"
            href={sourceUrl}
            title={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {sourceUrl}
          </a>
        )}
        <button className="copy-btn" onClick={copyUrl} title={sourceIsLocal ? t('openApiSync.header.copyPath') : t('openApiSync.header.copyUrl')} type="button">
          <IconCopy size={12} />
        </button>
      </div>
      <div className="linked-collection-row mt-1">
        <span className="spec-url-label">{t('openApiSync.header.linkedCollection')}</span>
        <span className="linked-collection-name">{collection.name}</span>
        {syncStatus === 'in-sync' && (
          <Help
            placement="bottom"
            width={240}
            iconComponent={() => <IconCircleCheck size={14} className="sync-status-icon in-sync" />}
          >
            {t('openApiSync.header.inSyncTooltip')}
          </Help>
        )}
        {syncStatus === 'not-in-sync' && (
          <Help
            placement="bottom"
            width={260}
            iconComponent={() => <IconAlertTriangle size={14} className="sync-status-icon not-in-sync" />}
          >
            {t('openApiSync.header.notInSyncTooltip')}
          </Help>
        )}
      </div>
    </div>
  );
};

export default OpenAPISyncHeader;
