import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { deleteEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const DeleteEnvironment = ({ onClose, environment, collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const onConfirm = () => {
    dispatch(deleteEnvironment(environment.uid, collection.uid))
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
          confirmButtonColor="danger"
        >
          {t('environments.delete.confirmPrefix')}<span className="font-medium">{environment.name}</span>{t('environments.delete.confirmSuffix')}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;
