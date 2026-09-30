import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import Portal from 'components/Portal';

const CreateExampleModal = ({ isOpen, onClose, onSave, title, initialName = '', confirmText }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const handleConfirm = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim());
      // Reset form
      setName('');
      setDescription('');
      setNameError('');
    } else {
      setNameError(t('collection.example.nameRequired'));
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName('');
    setDescription('');
    setNameError('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription('');
      setNameError('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={title ?? t('collection.example.createModalTitle')}
        handleCancel={handleClose}
        handleConfirm={handleConfirm}
        confirmText={confirmText ?? t('collection.example.confirmCreate')}
        cancelText={t('common.cancel')}
        isOpen={isOpen}
        dataTestId="create-example-modal"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="exampleName" className="block font-medium">
              {t('collection.example.nameLabel')}<span className="text-red-600">*</span>
            </label>
            <input
              id="exampleName"
              type="text"
              className="textbox mt-2 w-full"
              value={name}
              onChange={handleNameChange}
              autoFocus
              required
              data-testid="create-example-name-input"
            />
            {nameError && (
              <div className="text-red-500 mt-1" data-testid="name-error">
                {nameError}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="exampleDescription" className="block font-medium">
              {t('collection.example.descriptionLabel')}
            </label>
            <textarea
              id="exampleDescription"
              className="textbox mt-2 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="create-example-description-input"
            />
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default CreateExampleModal;
