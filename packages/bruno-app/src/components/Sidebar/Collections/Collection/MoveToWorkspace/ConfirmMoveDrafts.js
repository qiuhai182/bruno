import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { flattenItems, isItemARequest, hasRequestChanges, findCollectionByUid } from 'utils/collections';
import { saveRequest, saveMultipleRequests, moveCollectionToWorkspace } from 'providers/ReduxStore/slices/collections/actions';
import { deleteRequestDraft } from 'providers/ReduxStore/slices/collections';
import { IconAlertTriangle, IconDeviceFloppy } from '@tabler/icons';
import Modal from 'components/Modal';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';

const MAX_UNSAVED_REQUESTS_TO_SHOW = 5;

const ConfirmMoveDrafts = ({ onClose, collection, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isMoving, setIsMoving] = useState(false);

  const latestCollection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  const activeCollection = latestCollection || collection;

  const currentDrafts = useMemo(() => {
    if (!activeCollection) return [];
    const items = flattenItems(activeCollection.items);
    return items
      ?.filter((item) => isItemARequest(item) && hasRequestChanges(item) && !item.isTransient)
      .map((item) => {
        return {
          ...item,
          collectionUid: collectionUid
        };
      });
  }, [activeCollection, collectionUid]);

  const currentTransientDrafts = useMemo(() => {
    if (!activeCollection) return [];
    const items = flattenItems(activeCollection.items);
    return items
      ?.filter((item) => isItemARequest(item) && hasRequestChanges(item) && item.isTransient)
      .map((item) => {
        return {
          ...item,
          collectionUid: collectionUid
        };
      });
  }, [activeCollection, collectionUid]);

  const allDrafts = useMemo(() => {
    return [...currentDrafts, ...currentTransientDrafts];
  }, [currentDrafts, currentTransientDrafts]);

  const moveAndClose = () => {
    dispatch(moveCollectionToWorkspace(collectionUid))
      .then(() => {
        toast.success(t('sidebar.moveToWorkspace.collectionMoved'));
        onClose();
      })
      .catch((err) => {
        toast.error(err?.message || t('sidebar.moveToWorkspace.moveError'));
        setIsMoving(false);
      });
  };

  const handleSaveAll = () => {
    if (isMoving) {
      return;
    }
    // If there are transient drafts, we can't proceed with batch save
    if (currentTransientDrafts.length > 0) {
      toast.error(t('sidebar.drafts.saveTransientFirst'));
      return;
    }
    setIsMoving(true);
    // Save only non-transient drafts, then move
    if (currentDrafts.length > 0) {
      dispatch(saveMultipleRequests(currentDrafts))
        .then(() => moveAndClose())
        .catch(() => {
          toast.error(t('sidebar.drafts.failedToSaveRequests'));
          setIsMoving(false);
        });
    } else {
      moveAndClose();
    }
  };

  const handleDiscardAll = () => {
    if (isMoving) {
      return;
    }
    setIsMoving(true);
    // Discard all drafts (both regular and transient), then move
    allDrafts.forEach((draft) => {
      dispatch(deleteRequestDraft({
        collectionUid: collectionUid,
        itemUid: draft.uid
      }));
    });

    moveAndClose();
  };

  const handleSaveTransient = (draft) => {
    dispatch(saveRequest(draft.uid, collectionUid));
  };

  if (!currentDrafts.length && !currentTransientDrafts.length) {
    return null;
  }

  return (
    <StyledWrapper>
      <Modal
        size="md"
        title={t('sidebar.moveToWorkspace.title')}
        handleCancel={onClose}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        hideFooter={true}
      >
        <div className="flex items-center">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="warning-text" />
          <h1 className="ml-2 text-lg font-medium">{t('dialogs.holdOn')}</h1>
        </div>
        <p className="mt-4">
          {t('sidebar.drafts.unsavedChangesPrefix')}
          <span className="font-medium">{allDrafts.length}</span>{' '}
          {allDrafts.length === 1 ? t('sidebar.drafts.requestItemOne') : t('sidebar.drafts.requestItemMany')}
        </p>

        {/* Regular (saved) requests with changes */}
        {currentDrafts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {currentDrafts.length === 1 ? t('sidebar.drafts.savedRequestsOne', { count: currentDrafts.length }) : t('sidebar.drafts.savedRequestsMany', { count: currentDrafts.length })}
            </p>
            <ul className="ml-2">
              {currentDrafts.slice(0, MAX_UNSAVED_REQUESTS_TO_SHOW).map((item) => {
                return (
                  <li key={item.uid} className="mt-1 text-xs draft-list-item">
                    ? {item.filename || item.name}
                  </li>
                );
              })}
            </ul>
            {currentDrafts.length > MAX_UNSAVED_REQUESTS_TO_SHOW && (
              <p className="ml-2 mt-1 text-xs draft-list-item">
                {currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW === 1
                  ? t('sidebar.drafts.additionalOne', { count: currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW })
                  : t('sidebar.drafts.additionalMany', { count: currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW })}
              </p>
            )}
          </div>
        )}

        {/* Transient (unsaved) requests */}
        {currentTransientDrafts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {currentTransientDrafts.length === 1 ? t('sidebar.drafts.transientRequestsOne', { count: currentTransientDrafts.length }) : t('sidebar.drafts.transientRequestsMany', { count: currentTransientDrafts.length })}
            </p>
            <p className="text-xs transient-hint mb-3">
              {t('sidebar.drafts.transientHintMove')}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentTransientDrafts.map((item) => {
                return (
                  <div
                    key={item.uid}
                    className="flex items-center justify-between py-2 px-3 transient-item"
                  >
                    <span className="text-sm transient-item-name truncate mr-3">{item.name}</span>
                    <Button
                      data-testid="move-workspace-save-transient-draft"
                      color="primary"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveTransient(item)}
                      disabled={isMoving}
                      icon={<IconDeviceFloppy size={14} strokeWidth={1.5} />}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <div>
            <Button data-testid="move-workspace-discard-all" color="danger" onClick={handleDiscardAll} disabled={isMoving}>
              {t('sidebar.moveToWorkspace.discardAllAndMove')}
            </Button>
          </div>
          <div>
            <Button data-testid="move-workspace-cancel" className="mr-2" color="secondary" variant="ghost" onClick={onClose} disabled={isMoving}>
              {t('common.cancel')}
            </Button>
            <Button
              data-testid="move-workspace-save-and-move"
              onClick={handleSaveAll}
              disabled={currentTransientDrafts.length > 0 || isMoving}
              title={currentTransientDrafts.length > 0 ? t('sidebar.drafts.saveTransientFirst') : ''}
            >
              {isMoving ? t('sidebar.moveToWorkspace.moving') : currentDrafts.length > 1 ? t('sidebar.moveToWorkspace.saveAllAndMove') : t('sidebar.moveToWorkspace.saveAndMove')}
            </Button>
          </div>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default ConfirmMoveDrafts;
