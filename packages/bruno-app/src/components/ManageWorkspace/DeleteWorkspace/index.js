import React, { useState } from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { IconFolder } from '@tabler/icons';
import { closeWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTranslation } from 'react-i18next';

const DeleteWorkspace = ({ onClose, workspace }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const onConfirm = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await dispatch(closeWorkspaceAction(workspace.uid));
      onClose();
    } catch (error) {
      toast.error(error?.message || t('workspace.toast.removeError'));
      setIsDeleting(false);
    }
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('workspace.remove.title')}
        confirmText={isDeleting ? t('workspace.remove.removing') : t('workspace.remove.confirm')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmDisabled={isDeleting}
        confirmButtonColor="danger"
        dataTestId="remove-workspace-modal"
      >
        <div className="flex items-center">
          <IconFolder size={18} strokeWidth={1.5} />
          <span className="ml-2 mr-4 font-semibold">{workspace?.name}</span>
        </div>
        {workspace?.pathname && (
          <div className="break-words text-xs mt-1">{workspace.pathname}</div>
        )}
        <div className="mt-4">
          {t('workspace.remove.confirmPrefix')} <span className="font-semibold">{workspace?.name}</span>
          {t('workspace.remove.confirmSuffix')}
        </div>
        <div className="mt-4">
          {t('workspace.remove.note')}
        </div>
      </Modal>
    </Portal>
  );
};

export default DeleteWorkspace;
