import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const ConfirmCloseEnvironment = ({ onCancel, onCloseWithoutSave, onSaveAndClose, isGlobal, isDotEnv }) => {
  const { t } = useTranslation();

  let settingsLabel = t('environments.unsaved.collectionSettings');
  if (isDotEnv) {
    settingsLabel = t('environments.unsaved.dotEnvFile');
  } else if (isGlobal) {
    settingsLabel = t('environments.unsaved.globalSettings');
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={t('dialogs.unsavedChangesTitle')}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        handleCancel={onCancel}
        hideFooter={true}
      >
        <div className="flex items-center font-normal">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
          <h1 className="ml-2 text-lg font-medium">{t('environments.unsaved.holdOn')}</h1>
        </div>
        <div className="font-normal mt-4">
          {t('environments.unsaved.body', { label: settingsLabel })}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <Button color="danger" onClick={onCloseWithoutSave} data-testid="env-unsaved-close-without-save">
              {t('environments.unsaved.dontSave')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button color="secondary" variant="ghost" onClick={onCancel} data-testid="env-unsaved-cancel">
              {t('common.cancel')}
            </Button>
            <Button onClick={onSaveAndClose} data-testid="env-unsaved-save-and-close">
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default ConfirmCloseEnvironment;
