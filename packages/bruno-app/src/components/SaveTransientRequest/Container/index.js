import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { IconAlertTriangle, IconDeviceFloppy } from '@tabler/icons';
import { clearAllSaveTransientRequestModals } from 'providers/ReduxStore/slices/collections';
import { closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import SaveTransientRequest from 'components/SaveTransientRequest';
import StyledWrapper from './StyledWrapper';

const SaveTransientRequestContainer = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const modals = useSelector((state) => state.collections.saveTransientRequestModals);
  const [openItemUid, setOpenItemUid] = useState(null);

  // Reset openItemUid if the modal no longer exists in the array
  useEffect(() => {
    if (openItemUid && !modals.find((modal) => modal.item.uid === openItemUid)) {
      setOpenItemUid(null);
    }
  }, [modals, openItemUid]);

  const handleDiscardAll = () => {
    // Close all tabs for the transient requests (this will also delete the transient files)
    const tabUids = modals.map((modal) => modal.item.uid);
    dispatch(closeTabs({ tabUids }));

    // Clear all modals
    dispatch(clearAllSaveTransientRequestModals());

    // Show success message
    toast.success(t('saveTransient.toast.discardedRequests', { count: modals.length, s: modals.length === 1 ? '' : 's' }));
  };

  const handleCancel = () => {
    // Clear all modals on close
    dispatch(clearAllSaveTransientRequestModals());
  };

  const handleOpenSpecificModal = (itemUid) => {
    setOpenItemUid(itemUid);
  };

  // If a specific modal is open, show it
  if (openItemUid) {
    const modalToOpen = modals.find((modal) => modal.item.uid === openItemUid);
    if (modalToOpen) {
      return (
        <SaveTransientRequest
          item={modalToOpen.item}
          collection={modalToOpen.collection}
          isOpen={true}
          closeAfterSave={modalToOpen.closeAfterSave}
        />
      );
    }
  }

  // Show list of multiple modals
  return (
    <Modal
      size="md"
      title={t('saveTransient.unsavedTitle')}
      hideFooter={true}
      disableEscapeKey={true}
      disableCloseOnOutsideClick={true}
      handleCancel={handleCancel}
    >
      <div className="flex items-center">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
        <h1 className="ml-2 text-lg font-medium">{t('saveTransient.unsavedHeading')}</h1>
      </div>
      <p className="mt-4">
        {t('saveTransient.unsavedCountPrefix')} <span className="font-medium">{modals.length}</span>{' '}
        {t('saveTransient.unsavedCountSuffix', { count: modals.length, s: modals.length === 1 ? '' : 's' })}
      </p>

      <div className="mt-4">
        <p className="text-sm font-medium mb-2">
          {t('saveTransient.transientRequestsCount', { count: modals.length, s: modals.length === 1 ? '' : 's' })}
        </p>
        <p className="text-xs text-orange-600 mb-3">
          {t('saveTransient.transientRequestsNote')}
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {modals.map((modal) => {
            const { item, collection } = modal;
            return (
              <StyledWrapper
                key={item.uid}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col flex-1 min-w-0 mr-3">
                  <span className="text-sm request-name truncate">{item.name}</span>
                  <span className="text-xs collection-name truncate">
                    {collection.name}
                  </span>
                </div>
                <Button
                  color="primary"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenSpecificModal(item.uid)}
                  icon={<IconDeviceFloppy size={14} strokeWidth={1.5} />}
                >
                  {t('saveTransient.save')}
                </Button>
              </StyledWrapper>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4">
        <Button color="danger" onClick={handleDiscardAll}>
          {t('saveTransient.discardAll')}
        </Button>
      </div>
    </Modal>
  );
};

export default SaveTransientRequestContainer;
