import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { closeAiSidebar, dockAiChat } from 'providers/ReduxStore/slices/chat';
import PopoutWindow from '../PopoutWindow';
import AiChatSidebar from '../index';

const AiChatPopout = ({ collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleClose = useCallback(({ blocked } = {}) => {
    // Closing the OS window closes the assistant (like undocked devtools).
    // If window.open was blocked, fall back to the docked sidebar instead.
    dispatch(blocked ? dockAiChat() : closeAiSidebar());
  }, [dispatch]);

  return (
    <PopoutWindow title={t('aiChat.assistantTitle')} onClose={handleClose}>
      <AiChatSidebar collection={collection} variant="popout" />
    </PopoutWindow>
  );
};

export default AiChatPopout;
