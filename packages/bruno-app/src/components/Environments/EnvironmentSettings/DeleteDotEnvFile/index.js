import React from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const DeleteDotEnvFile = ({ onClose, onConfirm, filename = '.env' }) => {
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="sm"
          title={t('environments.dotEnv.deleteTitle', { filename })}
          confirmText={t('common.delete')}
          handleConfirm={handleConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          {t('environments.delete.confirmPrefix')}<span className="font-medium">{filename}</span>{t('environments.dotEnv.confirmSuffix')}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteDotEnvFile;
