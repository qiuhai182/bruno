import React from 'react';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { useState } from 'react';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const SaveFileErrorModal = ({ error }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(true);
  return (
    <>
      {showModal ? (
        <Portal>
          <StyledWrapper>
            <Modal
              size="sm"
              title={t('app.saveFileError.title')}
              hideFooter={true}
              hideCancel={true}
              handleCancel={() => {
                setShowModal(false);
              }}
              disableCloseOnOutsideClick={true}
              disableEscapeKey={true}
            >
              <pre className="w-full flex flex-wrap whitespace-pre-wrap">{error}</pre>
            </Modal>
          </StyledWrapper>
        </Portal>
      ) : null}
    </>
  );
};

export default SaveFileErrorModal;
