import { useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons';
import ToggleSwitch from 'components/ToggleSwitch';
import { useTranslation } from 'react-i18next';

const BUILT_IN_HEADER_EXAMPLES = [
  'Authorization',
  'Proxy-Authorization',
  'Cookie',
  'Set-Cookie',
  'X-API-Key',
  'X-Auth-Token',
  'X-Access-Token',
  'X-CSRF-Token'
];

const normalize = (raw) => String(raw || '').trim();

/**
 * Compact editor for a case-insensitive name list. Used for both custom
 * header names and custom variable names —— the shape is identical.
 */

const CHIP_MAX_LENGTH = 200;
const CHIP_MAX_COUNT = 200;

const ChipListEditor = ({ list, placeholder, onChange, addTestId, inputTestId, removeTestIdPrefix }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const values = Array.isArray(list) ? list : [];
  const atCapacity = values.length >= CHIP_MAX_COUNT;

  const handleAdd = () => {
    const value = normalize(draft);
    if (!value || value.length > CHIP_MAX_LENGTH || atCapacity) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const handleRemove = (name) => {
    onChange(values.filter((v) => v !== name));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const trimmedDraft = normalize(draft);
  const draftTooLong = trimmedDraft.length > CHIP_MAX_LENGTH;
  const addDisabled = !trimmedDraft || draftTooLong || atCapacity;

  return (
    <>
      <div className="security-add-row flex items-center gap-2">
        <input
          type="text"
          className="security-input flex-1"
          placeholder={placeholder}
          value={draft}
          maxLength={CHIP_MAX_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={atCapacity}
          data-testid={inputTestId}
        />
        <button
          type="button"
          className="security-add-btn inline-flex items-center gap-1 text-[11px] font-medium"
          onClick={handleAdd}
          disabled={addDisabled}
          data-testid={addTestId}
        >
          <IconPlus size={13} strokeWidth={1.75} />
          {t('preferences.ai.card.add')}
        </button>
      </div>

      {atCapacity && (
        <span className="security-sub text-[10.5px]">
          {t('preferences.ai.security.chipLimitReached', { count: CHIP_MAX_COUNT })}
        </span>
      )}

      {values.length > 0 && (
        <ul className="security-chip-list flex flex-wrap gap-1.5">
          {values.map((name) => (
            <li key={name} className="security-chip inline-flex items-center gap-1 min-w-0 max-w-full">
              <span className="security-chip-text">{name}</span>
              <button
                type="button"
                className="security-chip-remove"
                onClick={() => handleRemove(name)}
                aria-label={t('preferences.ai.security.removeNamed', { name })}
                data-testid={removeTestIdPrefix ? `${removeTestIdPrefix}-${name}` : undefined}
              >
                <IconTrash size={11} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const SecurityPane = ({
  aiEnabled,
  redactHeaders,
  redactBody,
  redactVariables,
  redactResponse,
  customRedactedHeaders,
  customRedactedVariables,
  onToggleRedactHeaders,
  onToggleRedactBody,
  onToggleRedactVariables,
  onToggleRedactResponse,
  onChangeCustomRedactedHeaders,
  onChangeCustomRedactedVariables
}) => {
  const { t } = useTranslation();

  if (!aiEnabled) {
    return (
      <div className="security-tab flex flex-col gap-3">
        <div className="ai-empty-notice px-3.5 py-3 text-xs">
          {t('preferences.ai.security.disabledNotice')}
        </div>
      </div>
    );
  }

  return (
    <div className="security-tab flex flex-col gap-3">
      <div className="ai-empty-notice px-3.5 py-3 text-xs">
        {t('preferences.ai.security.intro')}
      </div>

      <div className="security-card">
        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.redactHeadersTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.redactHeadersDesc')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactHeaders}
            handleToggle={() => onToggleRedactHeaders(!redactHeaders)}
            data-testid="ai-security-headers-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.redactBodyTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.redactBodyDesc')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactBody}
            handleToggle={() => onToggleRedactBody(!redactBody)}
            data-testid="ai-security-body-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.redactResponseTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.redactResponseDesc')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactResponse}
            handleToggle={() => onToggleRedactResponse(!redactResponse)}
            data-testid="ai-security-response-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.redactVariablesTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.redactVariablesDesc')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactVariables}
            handleToggle={() => onToggleRedactVariables(!redactVariables)}
            data-testid="ai-security-variables-toggle"
          />
        </div>
      </div>

      <div className="security-card">
        <div className="security-row flex flex-col gap-2 px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.customHeadersTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.customHeadersDesc')}
            </span>
          </div>
          <ChipListEditor
            list={customRedactedHeaders}
            placeholder="X-Custom-Token"
            onChange={onChangeCustomRedactedHeaders}
            inputTestId="ai-security-custom-header-input"
            addTestId="ai-security-custom-header-add"
            removeTestIdPrefix="ai-security-custom-header-remove"
          />
        </div>

        <div className="security-row flex flex-col gap-2 px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">{t('preferences.ai.security.customVariablesTitle')}</span>
            <span className="security-sub text-[11px]">
              {t('preferences.ai.security.customVariablesDesc')}
            </span>
          </div>
          <ChipListEditor
            list={customRedactedVariables}
            placeholder="MY_SESSION_TOKEN"
            onChange={onChangeCustomRedactedVariables}
            inputTestId="ai-security-custom-var-input"
            addTestId="ai-security-custom-var-add"
            removeTestIdPrefix="ai-security-custom-var-remove"
          />
        </div>

        <div className="security-row flex flex-col gap-1 px-3.5 py-3">
          <span className="text-[11px] font-medium security-sub">{t('preferences.ai.security.builtinCovered')}</span>
          <div className="security-builtin flex flex-wrap gap-1.5">
            {BUILT_IN_HEADER_EXAMPLES.map((name) => (
              <span key={name} className="security-builtin-chip">{name}</span>
            ))}
            <span className="security-builtin-more text-[10.5px]">
              {t('preferences.ai.security.builtinMore')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPane;
