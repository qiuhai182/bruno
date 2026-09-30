import React from 'react';
import { rgba } from 'polished';
import { IconBrightnessUp, IconMoon, IconDeviceDesktop } from '@tabler/icons';
import themes, { getLightThemes, getDarkThemes } from 'themes/index';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const themeModes = [
  { key: 'light', icon: IconBrightnessUp },
  { key: 'dark', icon: IconMoon },
  { key: 'system', icon: IconDeviceDesktop }
];

const ThemePreviewBox = ({ themeId, isDark }) => {
  const themeData = themes[themeId] || themes[isDark ? 'dark' : 'light'];
  const bgColor = themeData.background.base;
  const sidebarColor = themeData.sidebar.bg;
  const lineColor = rgba(themeData.brand, 0.5);

  return (
    <div className="theme-preview-box" style={{ background: bgColor, border: `1px solid ${lineColor}` }}>
      <div className="preview-sidebar" style={{ background: sidebarColor }} />
      <div className="preview-main">
        <div className="preview-line" style={{ background: lineColor, width: '80%' }} />
        <div className="preview-line" style={{ background: lineColor, width: '55%' }} />
        <div className="preview-line" style={{ background: lineColor, width: '70%' }} />
      </div>
    </div>
  );
};

const ThemeStep = ({ storedTheme, setStoredTheme, themeVariantLight, setThemeVariantLight, themeVariantDark, setThemeVariantDark }) => {
  const { t } = useTranslation();
  const lightThemeList = getLightThemes();
  const darkThemeList = getDarkThemes();

  const showLight = storedTheme === 'light' || storedTheme === 'system';
  const showDark = storedTheme === 'dark' || storedTheme === 'system';

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('preferences.themes.appearance')}</div>
      <div className="step-title">{t('welcome.theme.title')}</div>
      <div className="step-description">
        {t('welcome.theme.description')}
      </div>

      <div className="theme-mode-buttons">
        {themeModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.key}
              className={`theme-mode-btn ${storedTheme === mode.key ? 'active' : ''}`}
              onClick={() => setStoredTheme(mode.key)}
            >
              <Icon size={16} stroke={1.5} />
              {t(`preferences.themes.${mode.key}`)}
            </button>
          );
        })}
      </div>

      {showLight && (
        <div className="theme-variants-grid" style={{ marginBottom: showDark ? '1rem' : 0 }}>
          {lightThemeList.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className={`theme-variant-option ${themeVariantLight === theme.id ? 'selected' : ''}`}
              onClick={() => setThemeVariantLight(theme.id)}
              aria-pressed={themeVariantLight === theme.id}
            >
              <ThemePreviewBox themeId={theme.id} isDark={false} />
              <span className="variant-name">{theme.name}</span>
            </button>
          ))}
        </div>
      )}

      {showDark && (
        <div className="theme-variants-grid">
          {darkThemeList.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className={`theme-variant-option ${themeVariantDark === theme.id ? 'selected' : ''}`}
              onClick={() => setThemeVariantDark(theme.id)}
              aria-pressed={themeVariantDark === theme.id}
            >
              <ThemePreviewBox themeId={theme.id} isDark={true} />
              <span className="variant-name">{theme.name}</span>
            </button>
          ))}
        </div>
      )}
    </StyledWrapper>
  );
};

export default ThemeStep;
