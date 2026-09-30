import { IconChevronDown } from '@tabler/icons';
import ToggleSwitch from 'components/ToggleSwitch';
import { getPlatformModifierKey } from 'utils/common/platform';
import { useTranslation } from 'react-i18next';

/**
 * Autocomplete tab content. Sibling of the Configuration tab inside
 * Preferences > AI.
 *
 *   - master AI off          →→ notice only; the whole card is hidden
 *   - no provider configured →→ notice in the card body, controls disabled
 *   - no enabled model       →→ notice in the card body, controls disabled
 *   - everything on          →→ fully interactive
 */

const TRIGGER_MODES = [
  {
    value: 'aggressive',
    labelKey: 'preferences.ai.autocomplete.triggerAggressive',
    descriptionKey: 'preferences.ai.autocomplete.triggerAggressiveDesc'
  },
  {
    value: 'debounced',
    labelKey: 'preferences.ai.autocomplete.triggerDebounced',
    descriptionKey: 'preferences.ai.autocomplete.triggerDebouncedDesc'
  },
  {
    value: 'manual',
    labelKey: 'preferences.ai.autocomplete.triggerManual',
    descriptionKey: 'preferences.ai.autocomplete.triggerManualDesc'
  }
];

const AutocompletePane = ({
  aiEnabled,
  enabled,
  model,
  triggerMode,
  availableModels,
  hasConfiguredProvider,
  onToggleEnabled,
  onChangeModel,
  onChangeTriggerMode
}) => {
  const { t } = useTranslation();

  if (!aiEnabled) {
    return (
      <div className="autocomplete-tab flex flex-col gap-3">
        <div className="ai-empty-notice px-3.5 py-3 text-xs">
          {t('preferences.ai.autocomplete.disabledNotice')}
        </div>
      </div>
    );
  }

  const hasUsableModel = availableModels.length > 0;
  const isInteractive = enabled && hasUsableModel;
  const activeTrigger = TRIGGER_MODES.find((m) => m.value === (triggerMode || 'debounced'));

  // Surface the most actionable blocker first when the user can't actually
  // get suggestions yet.
  let blockerMessage = null;
  if (!hasConfiguredProvider) {
    blockerMessage = t('preferences.ai.autocomplete.blockerNoProvider');
  } else if (!hasUsableModel) {
    blockerMessage = t('preferences.ai.autocomplete.blockerNoModel');
  }

  return (
    <div className="autocomplete-tab flex flex-col gap-3">
      <div className="autocomplete-card">
        <div className="autocomplete-header flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.autocomplete.title')}</span>
            <span className="autocomplete-sub text-[11px]">
              {t('preferences.ai.autocomplete.subtitle')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={enabled}
            handleToggle={() => onToggleEnabled(!enabled)}
            data-testid="ai-autocomplete-enabled-toggle"
          />
        </div>
      </div>

      <div className={`autocomplete-card ${enabled ? '' : 'dimmed'}`}>
        {blockerMessage && (
          <div className="autocomplete-blocker px-3.5 py-3 text-[11px]">
            {blockerMessage}
          </div>
        )}

        <div className="autocomplete-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11.5px] font-medium">{t('preferences.ai.autocomplete.modelLabel')}</span>
            <span className="autocomplete-sub text-[10.5px]">
              {hasUsableModel
                ? t('preferences.ai.autocomplete.modelHint')
                : t('preferences.ai.autocomplete.modelEmpty')}
            </span>
          </div>
          <div className="model-select-wrap relative inline-flex items-center">
            <select
              className="model-select"
              value={model || ''}
              disabled={!isInteractive}
              onChange={(e) => onChangeModel(e.target.value)}
              aria-label={t('preferences.ai.autocomplete.modelSelectAria')}
              data-testid="ai-autocomplete-model-select"
            >
              <option value="">{t('preferences.ai.autocomplete.modelAuto')}</option>
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <IconChevronDown size={12} strokeWidth={1.75} className="model-select-chevron" />
          </div>
        </div>

        <div className="autocomplete-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11.5px] font-medium">{t('preferences.ai.autocomplete.triggerLabel')}</span>
            <span className="autocomplete-sub text-[10.5px]">
              {activeTrigger
                ? t(activeTrigger.descriptionKey, { modifier: getPlatformModifierKey() })
                : ''}
            </span>
          </div>
          <div className="trigger-pills inline-flex" role="radiogroup" aria-label={t('preferences.ai.autocomplete.triggerAria')}>
            {TRIGGER_MODES.map((m) => {
              const isSelected = (triggerMode || 'debounced') === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`trigger-pill ${isSelected ? 'selected' : ''}`}
                  disabled={!isInteractive}
                  onClick={() => onChangeTriggerMode(m.value)}
                  data-testid={`ai-autocomplete-trigger-${m.value}`}
                >
                  {t(m.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="autocomplete-row px-3.5 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium">{t('preferences.ai.autocomplete.keymapLabel')}</span>
            <div className="autocomplete-keymap text-[10.5px]">
              <kbd>Tab</kbd> {t('preferences.ai.autocomplete.keymapAccept')} · <kbd>{getPlatformModifierKey()}</kbd>+<kbd>→</kbd> {t('preferences.ai.autocomplete.keymapAcceptWord')} · <kbd>Esc</kbd> {t('preferences.ai.autocomplete.keymapDismiss')} · <kbd>{getPlatformModifierKey()}</kbd>+<kbd>\</kbd> {t('preferences.ai.autocomplete.keymapTrigger')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutocompletePane;
