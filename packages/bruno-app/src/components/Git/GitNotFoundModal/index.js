import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import Modal from 'components/Modal/index';
import Portal from 'components/Portal/index';

const getOSName = () => {
  const platform = window.navigator.userAgentData?.platform || '';
  if (platform.startsWith('Win')) {
    return 'Windows';
  } else if (platform.startsWith('Mac')) {
    return 'macOS';
  } else if (platform.startsWith('Linux')) {
    return 'Linux';
  } else {
    return i18n.t('gitNotFound.yourOs');
  }
};

const getDownloadUrl = (os) => {
  switch (os) {
    case 'Windows':
      return 'https://git-scm.com/download/win';
    case 'macOS':
      return 'https://git-scm.com/download/mac';
    case 'Linux':
      return 'https://git-scm.com/download/linux';
    default:
      return 'https://git-scm.com/download';
  }
};

const GitNotFoundModal = ({ onClose }) => {
  const { t } = useTranslation();
  const osName = getOSName();
  const downloadUrl = getDownloadUrl(osName);

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('gitNotFound.title')}
        handleCancel={onClose}
        hideFooter={true}
      >
        <div>
          <p>{t('gitNotFound.body')}</p>
          <p className="mt-2">
            {t('gitNotFound.downloadPrefix')} <strong>{osName}</strong>{t('gitNotFound.downloadSuffix')}
          </p>
          <p>
            <span
              className="text-blue-600 cursor-pointer border-b border-blue-600"
              onClick={() => window.open(downloadUrl, '_blank')}
            >
              {t('gitNotFound.downloadLink', { os: osName })}
            </span>
          </p>
        </div>
      </Modal>
    </Portal>
  );
};

export default GitNotFoundModal;
