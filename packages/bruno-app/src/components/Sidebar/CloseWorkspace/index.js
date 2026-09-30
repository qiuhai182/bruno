import React from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconFolder } from '@tabler/icons';
import { closeWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';

const CloseWorkspace = ({ workspaceUid, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { workspaces } = useSelector((state) => state.workspaces);
  const workspace = workspaces.find((w) => w.uid === workspaceUid);

  const onConfirm = async () => {
    try {
      if (!workspace) {
        toast.error(t('sidebar.closeWorkspace.workspaceNotFound'));
        onClose();
        return;
      }
      if (workspace.type === 'default') {
        toast.error(t('sidebar.closeWorkspace.cannotCloseDefault'));
        onClose();
        return;
      }

      await dispatch(closeWorkspaceAction(workspace.uid));
      toast.success(t('sidebar.closeWorkspace.closed'));
      onClose();
    } catch (error) {
      console.error('Error closing workspace:', error);
      toast.error(t('sidebar.closeWorkspace.closeError'));
    }
  };

  return (
    <Modal
      size="sm"
      title={t('sidebar.closeWorkspace.title')}
      confirmText={t('common.close')}
      handleConfirm={onConfirm}
      handleCancel={onClose}
    >
      <div className="flex items-center">
        <IconFolder size={18} strokeWidth={1.5} />
        <span className="ml-2 mr-4 font-semibold">{workspace?.name}</span>
      </div>
      {workspace?.pathname && (
        <div className="break-words text-xs mt-1">{workspace.pathname}</div>
      )}
      <div className="mt-4">
        {t('sidebar.closeWorkspace.confirmPrefix')} <span className="font-semibold">{workspace?.name}</span>{t('sidebar.closeWorkspace.confirmSuffix')}
      </div>
      <div className="mt-4">
        {t('sidebar.closeWorkspace.stillAvailableNote')}
      </div>
    </Modal>
  );
};

export default CloseWorkspace;
