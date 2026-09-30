import React from 'react';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { useState } from 'react';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const IpcErrorModal = ({ error }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(true);
  return (
    <>
      {showModal ? (
        <StyledWrapper>
          <Portal>
            <Modal
              size="sm"
              title={t('app.error.title')}
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
          </Portal>
        </StyledWrapper>
      ) : null}
    </>
  );
};

export default IpcErrorModal;
