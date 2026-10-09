import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import { deleteMockServerInstance } from 'utils/mock-server/mock-server-instances';

const DeleteMockServerModal = ({ instance, onClose, onDeleted }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleConfirm = async () => {
    try {
      await dispatch(deleteMockServerInstance(instance.uid));
      toast.success(t('mockServer.delete.deleted'));
      onDeleted?.();
      onClose();
    } catch {
      toast.error(t('mockServer.delete.failed'));
    }
  };

  return (
    <MockConfirmModal
      title={t('mockServer.delete.title')}
      confirmText={t('mockServer.delete.label')}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmButtonColor="danger"
      dataTestId="delete-mock-server-modal"
    >
      {t('mockServer.delete.confirm', { name: instance.name })}
      {instance.sourceType === 'spec' ? (
        <div className="text-xs mt-3 opacity-70">{t('mockServer.delete.specNote')}</div>
      ) : null}
    </MockConfirmModal>
  );
};

export default DeleteMockServerModal;
