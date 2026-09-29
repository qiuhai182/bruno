import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import Portal from 'ui/Portal';
import { useTranslation } from 'react-i18next';

const ConfirmRequestClose = ({ item, example, onCancel, onCloseWithoutSave, onSaveAndClose }) => {
  const { t } = useTranslation();
  const isExample = !!example;
  const itemName = isExample ? example.name : item.name;
  const itemType = isExample ? 'example' : 'request';

  return (
    <Portal>
      <Modal
        size="md"
        title={t('dialogs.unsavedChangesTitle')}
        confirmText={t('dialogs.saveAndClose')}
        cancelText={t('dialogs.closeWithoutSaving')}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        handleCancel={onCancel}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        hideFooter={true}
      >
        <div className="flex items-center font-normal">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
          <h1 className="ml-2 text-lg font-medium">{t('dialogs.holdOn')}</h1>
        </div>
        <div className="font-normal mt-4">
          {t('dialogs.unsavedChangesIn')} {t(`dialogs.itemType.${itemType}`)}{' '}
          <span className="font-medium">{itemName}</span>.
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <Button color="danger" onClick={onCloseWithoutSave}>
              {t('dialogs.dontSave')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button color="secondary" variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onSaveAndClose}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default ConfirmRequestClose;
