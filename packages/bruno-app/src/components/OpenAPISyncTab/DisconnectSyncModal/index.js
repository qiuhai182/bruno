import { useTranslation } from 'react-i18next';
import Button from 'ui/Button';
import Modal from 'components/Modal';

const DisconnectSyncModal = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      size="sm"
      title={t('openApiSync.disconnect.title')}
      hideFooter={true}
      handleCancel={onClose}
    >
      <div className="disconnect-modal">
        <p className="disconnect-message">
          <>{t('openApiSync.disconnect.message')} </> <br /> <br />
          <>{t('openApiSync.disconnect.note')}</>
        </p>
        <div className="disconnect-actions">
          <Button variant="ghost" color="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button color="danger" onClick={onConfirm}>
            {t('openApiSync.disconnect.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DisconnectSyncModal;
