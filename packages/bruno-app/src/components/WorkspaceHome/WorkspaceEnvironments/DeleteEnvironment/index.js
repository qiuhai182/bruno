import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { deleteGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { useTranslation } from 'react-i18next';

const DeleteEnvironment = ({ onClose, environment }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const onConfirm = () => {
    dispatch(deleteGlobalEnvironment({ environmentUid: environment.uid }))
      .then(() => {
        toast.success(t('environments.toast.deleted'));
        onClose();
      })
      .catch(() => toast.error(t('environments.toast.deleteError')));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('environments.delete.title')}
          confirmText={t('common.delete')}
          handleConfirm={onConfirm}
          handleCancel={onClose}
        >
          {t('environments.delete.confirmPrefix')} <span className="font-semibold">{environment.name}</span>
          {t('environments.delete.confirmSuffix')}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;
