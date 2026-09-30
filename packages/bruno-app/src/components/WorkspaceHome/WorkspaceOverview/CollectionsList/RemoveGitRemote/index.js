import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { disconnectCollectionFromGit } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTranslation } from 'react-i18next';

const RemoveGitRemote = ({ collectionPath, collectionName, remoteUrl, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const handleConfirm = () => {
    dispatch(
      disconnectCollectionFromGit({
        workspaceUid: activeWorkspaceUid,
        collectionPath
      })
    )
      .then(() => {
        toast.success(t('workspace.git.toast.removed'));
        onClose();
      })
      .catch(() => {
        // toast already handled in the thunk
      });
  };

  return (
    <Modal
      size="md"
      title={t('workspace.git.removeTitle')}
      confirmText={t('workspace.git.removeAction')}
      confirmButtonColor="primary"
      handleConfirm={handleConfirm}
      handleCancel={onClose}
    >
      <div className="text-sm leading-relaxed break-words">
        <p className="m-0">
          {t('workspace.git.disconnectPrefix')}{' '}
          <span className="font-medium break-words" title={collectionName}>
            {collectionName}
          </span>{' '}
          {t('workspace.git.disconnectSuffix')}
        </p>
        {remoteUrl ? (
          <p className="mt-2 mb-0 font-mono text-xs text-muted break-all">{remoteUrl}</p>
        ) : null}
        <p className="mt-3 mb-0 text-xs text-muted">
          {t('workspace.git.removeNotePrefix')} <span className="font-mono">workspace.yml</span>
          {t('workspace.git.removeNoteMid')} <span className="font-mono">.git</span>{' '}
          {t('workspace.git.removeNoteSuffix')}
        </p>
      </div>
    </Modal>
  );
};

export default RemoveGitRemote;
