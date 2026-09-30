import React from 'react';
import Modal from 'components/Modal';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ignoreFolder, closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { recursivelyGetAllItemUids } from 'utils/collections';
import toast from 'react-hot-toast';

const IgnoreCollectionItem = ({ onClose, item, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collection = useSelector((state) => state.collections.collections?.find((c) => c.uid === collectionUid));
  const isYamlCollection = collection?.format === 'yml' || Boolean(collection?.brunoConfig?.opencollection);
  const configFileName = isYamlCollection ? 'opencollection.yml' : 'bruno.json';

  const onConfirm = () => {
    dispatch(ignoreFolder(item.uid, collectionUid))
      .then(() => {
        const tabUids = [...recursivelyGetAllItemUids(item.items), item.uid];
        dispatch(closeTabs({ tabUids }));
        toast.success(t('sidebar.ignore.folderIgnored'));
      })
      .catch((error) => {
        console.error('Error ignoring folder', error);
        toast.error(error?.message || t('sidebar.ignore.errorIgnoring'));
      });
    onClose();
  };

  return (
    <Modal
      size="md"
      title={t('sidebar.ignore.title')}
      confirmText={t('sidebar.menu.ignore')}
      handleConfirm={onConfirm}
      handleCancel={onClose}
    >
      {t('sidebar.ignore.prefix')}
      {' '}
      <span className="font-medium">{item.name}</span>
      {' '}
      {t('sidebar.ignore.hideFrom')}
      {' '}
      {isYamlCollection ? 'opencollection (YAML)' : 'Bruno (JSON)'}
      {' '}
      {t('sidebar.ignore.collectionByAdding')}
      {' '}
      <span className="font-medium">ignore</span>
      {' '}
      {t('sidebar.ignore.listIn')}
      {' '}
      <span className="font-medium">{configFileName}</span>
      {t('sidebar.ignore.notDeletedRestore')}
      {' '}
      <span className="font-medium">ignore</span>
      {' '}
      {t('sidebar.ignore.listInAfter')}
      {' '}
      <span className="font-medium">{configFileName}</span>
      {t('sidebar.ignore.finalPeriod')}
    </Modal>
  );
};

export default IgnoreCollectionItem;
