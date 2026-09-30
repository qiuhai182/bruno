import { IconBell } from '@tabler/icons';
import ToolHint from 'components/ToolHint';
import StyledWrapper from './StyledWrapper';
import NotificationsModal from './NotificationsModal';
import useNotifications from './hooks/useNotifications';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t } = useTranslation();
  const notifications = useNotifications();
  const { isOpen, unreadCount, open, close } = notifications;

  return (
    <>
      <StyledWrapper onClick={open} aria-label={t('notifications.openAriaLabel')}>
        <ToolHint text={t('notifications.title')} toolhintId="Notifications" offset={8}>
          <IconBell size={16} aria-hidden strokeWidth={1.5} />
          {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        </ToolHint>
      </StyledWrapper>

      {isOpen && <NotificationsModal notifications={notifications} onClose={close} />}
    </>
  );
};

export default Notifications;
