import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { useDispatch } from 'react-redux';
import { deleteResponseExample } from 'providers/ReduxStore/slices/collections';
import { saveRequest, closeTabs } from 'providers/ReduxStore/slices/collections/actions';

const DeleteResponseExampleModal = ({ onClose, example, item, collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onConfirm = (e) => {
    e.stopPropagation();
    dispatch(closeTabs({ tabUids: [example.uid] }));
    dispatch(deleteResponseExample({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: example.uid
    }));
    dispatch(saveRequest(item.uid, collection.uid, true))
      .then(() => {
        onClose();
      });
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('sidebar.deleteItems.titleExampleOne')}
        confirmText={t('common.delete')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmButtonColor="danger"
      >
        {t('sidebar.deleteItems.confirmExamplePrefix')} <span className="font-medium">{example.name}</span>{t('sidebar.deleteItems.confirmSuffix')}
      </Modal>
    </Portal>
  );
};

export default DeleteResponseExampleModal;
