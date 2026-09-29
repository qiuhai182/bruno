const path = require('path');
const { Tray, Menu, ipcMain, nativeImage, shell } = require('electron');
const { getPreferences } = require('../store/preferences');

// The main process has no react-i18next; tray labels follow the language
// preference with a simple map (kept in sync with the renderer translations).
const LABELS = {
  en: {
    showWindow: 'Show Window',
    openInBrowser: 'Open in Browser',
    settings: 'Settings',
    quit: 'Quit'
  },
  'zh-CN': {
    showWindow: '显示主窗口',
    openInBrowser: '在浏览器中打开',
    settings: '设置',
    quit: '退出'
  }
};

/**
 * System tray icon that keeps Bruno resident when the main window is closed
 * (or hidden), and provides quick access to the main window, the browser
 * web client and a real quit action.
 */
class AppTray {
  constructor({ getMainWindow, getWebServerUrl, isTrayResident }) {
    this.getMainWindow = getMainWindow;
    this.getWebServerUrl = getWebServerUrl;
    this.isTrayResident = isTrayResident;
    this.tray = null;
  }

  init() {
    const iconPath = path.join(__dirname, 'about/256x256.png');
    const icon = nativeImage.createFromPath(iconPath);
    // The source icon is 256x256; tray icons expect a small image.
    this.tray = new Tray(process.platform === 'win32' ? icon.resize({ width: 16, height: 16 }) : icon);
    this.tray.setToolTip('Bruno');
    this.tray.on('double-click', () => this.showMainWindow());
    this.rebuildMenu();
  }

  rebuildMenu() {
    if (!this.tray) {
      return;
    }

    const language = getPreferences()?.general?.language || 'zh-CN';
    const labels = LABELS[language] || LABELS.en;

    const template = [
      {
        label: labels.showWindow,
        click: () => this.showMainWindow()
      }
    ];

    const webUrl = this.getWebServerUrl && this.getWebServerUrl();
    if (webUrl) {
      template.push({
        label: labels.openInBrowser,
        click: () => shell.openExternal(webUrl)
      });
    }

    template.push(
      { type: 'separator' },
      {
        label: labels.settings,
        click: () => {
          // Open the window first so the preferences tab is visible.
          this.showMainWindow();
          ipcMain.emit('main:open-preferences');
        }
      },
      { type: 'separator' },
      {
        label: labels.quit,
        click: () => this.quitApp()
      }
    );

    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }

  showMainWindow() {
    const mainWindow = this.getMainWindow && this.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  quitApp() {
    // Reuse the regular quit flow so unsaved requests get handled by the
    // renderer. Show the window first so any save prompts are visible.
    this.showMainWindow();
    ipcMain.emit('main:start-quit-flow');
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = AppTray;
