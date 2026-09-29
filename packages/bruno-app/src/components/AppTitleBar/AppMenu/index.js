import React, { useState } from 'react';
import { IconMenu2 } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import ActionIcon from 'ui/ActionIcon';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const AppMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { ipcRenderer } = window;
  const { t } = useTranslation();

  const menuItems = [
    {
      id: 'file',
      label: t('app.menu.file.title'),
      submenu: [
        {
          id: 'open-collection',
          label: t('app.menu.file.openCollection'),
          onClick: () => ipcRenderer?.send('renderer:open-collection')
        },
        { type: 'divider', id: 'file-div-1' },
        {
          id: 'preferences',
          label: t('app.menu.file.preferences'),
          rightSection: <span className="shortcut">Ctrl+,</span>,
          onClick: () => ipcRenderer?.invoke('renderer:open-preferences')
        },
        { type: 'divider', id: 'file-div-2' },
        {
          id: 'quit',
          label: t('app.menu.file.quit'),
          rightSection: <span className="shortcut">Alt+F4</span>,
          onClick: () => ipcRenderer?.send('renderer:window-close')
        }
      ]
    },
    {
      id: 'edit',
      label: t('app.menu.edit.title'),
      submenu: [
        {
          id: 'undo',
          label: t('app.menu.edit.undo'),
          rightSection: <span className="shortcut">Ctrl+Z</span>,
          onClick: () => document.execCommand('undo')
        },
        {
          id: 'redo',
          label: t('app.menu.edit.redo'),
          rightSection: <span className="shortcut">Ctrl+Y</span>,
          onClick: () => document.execCommand('redo')
        },
        { type: 'divider', id: 'edit-div-1' },
        {
          id: 'cut',
          label: t('app.menu.edit.cut'),
          rightSection: <span className="shortcut">Ctrl+X</span>,
          onClick: () => document.execCommand('cut')
        },
        {
          id: 'copy',
          label: t('app.menu.edit.copy'),
          rightSection: <span className="shortcut">Ctrl+C</span>,
          onClick: () => document.execCommand('copy')
        },
        {
          id: 'paste',
          label: t('app.menu.edit.paste'),
          rightSection: <span className="shortcut">Ctrl+V</span>,
          onClick: () => document.execCommand('paste')
        },
        { type: 'divider', id: 'edit-div-2' },
        {
          id: 'select-all',
          label: t('app.menu.edit.selectAll'),
          rightSection: <span className="shortcut">Ctrl+A</span>,
          onClick: () => document.execCommand('selectAll')
        }
      ]
    },
    {
      id: 'view',
      label: t('app.menu.view.title'),
      submenu: [
        {
          id: 'toggle-devtools',
          label: t('app.menu.view.developerTools'),
          rightSection: <span className="shortcut">Ctrl+Shift+I</span>,
          onClick: () => ipcRenderer?.invoke('renderer:toggle-devtools')
        },
        { type: 'divider', id: 'view-div-1' },
        {
          id: 'reset-zoom',
          label: t('app.menu.view.resetZoom'),
          rightSection: <span className="shortcut">Ctrl+0</span>,
          onClick: () => ipcRenderer?.invoke('renderer:reset-zoom')
        },
        {
          id: 'zoom-in',
          label: t('app.menu.view.zoomIn'),
          rightSection: <span className="shortcut">Ctrl++</span>,
          onClick: () => ipcRenderer?.invoke('renderer:zoom-in')
        },
        {
          id: 'zoom-out',
          label: t('app.menu.view.zoomOut'),
          rightSection: <span className="shortcut">Ctrl+-</span>,
          onClick: () => ipcRenderer?.invoke('renderer:zoom-out')
        },
        { type: 'divider', id: 'view-div-2' },
        {
          id: 'toggle-fullscreen',
          label: t('app.menu.view.fullScreen'),
          rightSection: <span className="shortcut">F11</span>,
          onClick: () => ipcRenderer?.invoke('renderer:toggle-fullscreen')
        }
      ]
    },
    {
      id: 'help',
      label: t('app.menu.help.title'),
      submenu: [
        {
          id: 'about',
          label: t('app.menu.help.about'),
          onClick: () => ipcRenderer?.invoke('renderer:open-about')
        },
        {
          id: 'documentation',
          label: t('app.menu.help.documentation'),
          onClick: () => ipcRenderer?.invoke('renderer:open-docs')
        }
      ]
    }
  ];

  return (
    <StyledWrapper>
      <MenuDropdown
        opened={isOpen}
        onChange={setIsOpen}
        placement="bottom-start"
        showTickMark={false}
        items={menuItems}
      >
        <ActionIcon label={t('app.menu.menuButton')} size="lg">
          <IconMenu2 size={16} stroke={1.5} />
        </ActionIcon>
      </MenuDropdown>
    </StyledWrapper>
  );
};

export default AppMenu;
