import React from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button';

const ModeSwitch = ({ isMarkdownMode, onToggle, className, ...props }) => {
  const { t } = useTranslation();
  return (
    <StyledWrapper className={className} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className={`${!isMarkdownMode ? 'is-active' : ''}`}
        onClick={() => { if (isMarkdownMode) onToggle(); }}
      >
        <span className="mode-text">{t('modeSwitch.richText')}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${isMarkdownMode ? 'is-active' : ''}`}
        onClick={() => { if (!isMarkdownMode) onToggle(); }}
      >
        <span className="mode-text">{t('modeSwitch.markdown')}</span>
      </Button>
    </StyledWrapper>
  );
};

export default ModeSwitch;
