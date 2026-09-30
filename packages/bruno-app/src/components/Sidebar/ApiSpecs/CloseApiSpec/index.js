import React from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import { IconFileCode } from '@tabler/icons';
import { closeApiSpecFile } from 'providers/ReduxStore/slices/apiSpec';

const CloseApiSpec = ({ onClose, apiSpec }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onConfirm = () => {
    dispatch(closeApiSpecFile({ uid: apiSpec.uid }))
      .then(() => {
        toast.success(t('sidebar.apiSpecs.close.closed'));
        onClose();
      })
      .catch(() => toast.error(t('sidebar.apiSpecs.close.closeError')));
  };

  return (
    <Modal size="sm" title={t('sidebar.apiSpecs.close.title')} confirmText={t('common.close')} handleConfirm={onConfirm} handleCancel={onClose}>
      <div className="flex items-center">
        <IconFileCode size={18} strokeWidth={1.5} />
        <span className="ml-2 mr-4 font-semibold">{apiSpec.name}</span>
      </div>
      <div className="break-words text-xs mt-1">{apiSpec.pathname}</div>
      <div className="mt-4">
        {t('sidebar.apiSpecs.close.confirmPrefix')} <span className="font-semibold">{apiSpec.name}</span>{t('sidebar.apiSpecs.close.confirmSuffix')}
      </div>
      <div className="mt-4">
        {t('sidebar.apiSpecs.close.stillAvailableNote')}
      </div>
    </Modal>
  );
};

export default CloseApiSpec;
