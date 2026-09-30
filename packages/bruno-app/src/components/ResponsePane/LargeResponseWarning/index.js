import React from 'react';
import { IconDownload, IconCopy, IconEye, IconAlertTriangle } from '@tabler/icons';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';
import { formatSize } from 'utils/common/index';
import Button from 'ui/Button/index';

const LargeResponseWarning = ({ item, responseSize, onRevealResponse }) => {
  const { t } = useTranslation();
  const { ipcRenderer } = window;
  const response = item.response || {};

  const downloadResponseToFile = () => {
    return new Promise((resolve, reject) => {
      ipcRenderer
        .invoke('renderer:save-response-to-file', response, item.requestSent.url, item.pathname)
        .then((result) => {
          if (result && result.success) {
            toast.success(t('responsePane.downloadSuccess'));
          }
          resolve();
        })
        .catch((err) => {
          toast.error(get(err, 'error.message') || t('responsePane.genericError'));
          reject(err);
        });
    });
  };

  const copyResponse = () => {
    try {
      const textToCopy = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2);

      navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success(t('responsePane.copySuccess'));
      }).catch(() => {
        toast.error(t('responsePane.copyFailed'));
      });
    } catch (error) {
      toast.error(t('responsePane.copyFailed'));
    }
  };

  return (
    <StyledWrapper>
      <div className="warning-container">
        <div className="warning-icon">
          <IconAlertTriangle size={45} strokeWidth={2} />
        </div>
        <div className="warning-content">
          <div className="warning-title">
            {t('responsePane.largeResponse.title')}
          </div>
          <div className="warning-description">
            {t('responsePane.largeResponse.descriptionPrefix')} <span className="size-highlight supported-size">{formatSize(10 * 1024 * 1024)}</span> {t('responsePane.largeResponse.descriptionSuffix')}
            <br />
            {t('responsePane.largeResponse.currentSizePrefix')} <span className="size-highlight current-size">{formatSize(responseSize)}</span>
          </div>
        </div>
      </div>
      <div className="warning-actions">
        <Button
          icon={<IconEye size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={onRevealResponse}
          title={t('responsePane.largeResponse.showContent')}
          color="secondary"
          size="sm"
        >
          {t('responsePane.largeResponse.view')}
        </Button>
        <Button
          icon={<IconDownload size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={downloadResponseToFile}
          disabled={!response.dataBuffer}
          title={t('responsePane.largeResponse.downloadToFile')}
          color="secondary"
          size="sm"
        >
          {t('responsePane.largeResponse.download')}
        </Button>
        <Button
          icon={<IconCopy size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={copyResponse}
          disabled={!response.data}
          title={t('responsePane.largeResponse.copyToClipboard')}
          color="secondary"
          size="sm"
        >
          {t('responsePane.largeResponse.copy')}
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default LargeResponseWarning;
