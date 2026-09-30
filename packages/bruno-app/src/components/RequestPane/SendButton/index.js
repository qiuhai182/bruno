import React from 'react';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const SendButton = ({ isLoading = false, disabled = false, onSend, onCancel, testId = 'send-request-btn' }) => {
  const { t } = useTranslation();
  return (
    <StyledWrapper className="ml-2">
      <Button
        size="sm"
        disabled={disabled}
        variant={isLoading ? 'outline' : 'filled'}
        color="primary"
        data-testid={testId}
        data-action={isLoading ? 'cancel' : 'send'}
        onClick={isLoading ? onCancel : onSend}
      >
        {isLoading ? t('common.cancel') : t('requestPane.sendButton.send')}
      </Button>
    </StyledWrapper>
  );
};

export default SendButton;
