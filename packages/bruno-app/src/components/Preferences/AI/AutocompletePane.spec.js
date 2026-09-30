import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

global.React = React;

jest.mock('utils/common/platform', () => ({
  getPlatformModifierKey: jest.fn(() => 'Ctrl')
}));

import { getPlatformModifierKey } from 'utils/common/platform';
import AutocompletePane from './AutocompletePane';

jest.mock('react-i18next', () => {
  const translations = {
    'preferences.ai.autocomplete.title': 'Inline Autocomplete',
    'preferences.ai.autocomplete.subtitle': 'Ghost-text suggestions in Pre-Request, Post-Response, and Tests scripts',
    'preferences.ai.autocomplete.disabledNotice': 'Turn on AI in the Configuration tab to use autocomplete.',
    'preferences.ai.autocomplete.blockerNoProvider': 'Add a provider API key in the Configuration tab to enable autocomplete.',
    'preferences.ai.autocomplete.blockerNoModel': 'No models are available. Enable a model on its provider card in Configuration.',
    'preferences.ai.autocomplete.modelLabel': 'Model',
    'preferences.ai.autocomplete.modelHint': 'Lightweight models are recommended for speed',
    'preferences.ai.autocomplete.modelEmpty': 'No model available yet',
    'preferences.ai.autocomplete.modelSelectAria': 'Autocomplete model',
    'preferences.ai.autocomplete.modelAuto': 'Auto (fastest available)',
    'preferences.ai.autocomplete.triggerLabel': 'Trigger',
    'preferences.ai.autocomplete.triggerAria': 'Trigger mode',
    'preferences.ai.autocomplete.triggerAggressive': 'Aggressive',
    'preferences.ai.autocomplete.triggerAggressiveDesc': 'Suggest after every keystroke',
    'preferences.ai.autocomplete.triggerDebounced': 'Debounced',
    'preferences.ai.autocomplete.triggerDebouncedDesc': 'Suggest after you pause typing (default)',
    'preferences.ai.autocomplete.triggerManual': 'Manual',
    'preferences.ai.autocomplete.triggerManualDesc': 'Only on {{modifier}}+\',
    'preferences.ai.autocomplete.keymapLabel': 'Keymap',
    'preferences.ai.autocomplete.keymapAccept': 'accept',
    'preferences.ai.autocomplete.keymapAcceptWord': 'accept word',
    'preferences.ai.autocomplete.keymapDismiss': 'dismiss',
    'preferences.ai.autocomplete.keymapTrigger': 'trigger'
  };
  return {
    useTranslation: () => ({
      t: (key, params) => String(translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, k) => params?.[k] ?? '')
    })
  };
});

const theme = {
  primary: { solid: '#6366f1' },
  input: { bg: '#111827' },
  colors: { text: { muted: '#9ca3af' } }
};

const baseProps = {
  aiEnabled: true,
  enabled: true,
  model: '',
  triggerMode: 'manual',
  availableModels: [{ id: 'model-1', label: 'Model 1' }],
  hasConfiguredProvider: true,
  onToggleEnabled: jest.fn(),
  onChangeModel: jest.fn(),
  onChangeTriggerMode: jest.fn()
};

const renderPane = (modifier, props = {}) => {
  getPlatformModifierKey.mockReturnValue(modifier);
  return render(
    <ThemeProvider theme={theme}>
      <AutocompletePane {...baseProps} {...props} />
    </ThemeProvider>
  );
};

describe('AutocompletePane shortcut copy', () => {
  it.each([
    ['macOS', '⌘'],
    ['non-macOS', 'Ctrl']
  ])('shows the %s modifier in the keymap', (_platform, modifier) => {
    renderPane(modifier);
    expect(screen.getAllByText(modifier).length).toBeGreaterThan(0);
  });

  it('shows the platform modifier in the manual trigger description', () => {
    renderPane('Ctrl');
    expect(screen.getByText('Only on Ctrl+\\')).toBeInTheDocument();
  });
});
