import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlertTriangle } from '@tabler/icons';
import { removeCollectionFromWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { findCollectionByUid } from 'utils/collections/index';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DeleteCollection = ({ onClose, collectionUid, workspaceUid }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const workspace = useSelector((state) => state.workspaces.workspaces.find((w) => w.uid === workspaceUid));

  const isConfirmed = confirmText.toLowerCase() === 'delete';

  const onConfirm = async () => {
    if (!collection || !workspace) {
      toast.error(t('dialogs.deleteCollection.notFound'));
      onClose();
      return;
    }

    try {
      await dispatch(removeCollectionFromWorkspaceAction(workspace.uid, collection.pathname, { deleteFiles: true }));
      toast.success(t('dialogs.deleteCollection.deleted', { name: collection.name }));
      onClose();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(error.message || t('dialogs.deleteCollection.deleteError'));
    }
  };

  if (!collection) {
    return null;
  }

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={t('dialogs.deleteCollection.title')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmButtonColor="danger"
        confirmDisabled={!isConfirmed}
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        <p className="modal-description">
          {t('dialogs.deleteCollection.bodyPrefix')} <strong>"{collection.name}"</strong>?
        </p>
        <div className="collection-info-card">
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.pathname}</div>
        </div>
        <p className="warning-text">
          {t('dialogs.deleteCollection.warning')}
        </p>
        <div className="delete-confirmation">
          <label htmlFor="delete-confirm-input">
            {t('dialogs.deleteCollection.typePrefix')} <span className="delete-keyword">delete</span>{' '}
            {t('dialogs.deleteCollection.toConfirm')}
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            autoComplete="off"
            autoFocus
          />
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default DeleteCollection;
