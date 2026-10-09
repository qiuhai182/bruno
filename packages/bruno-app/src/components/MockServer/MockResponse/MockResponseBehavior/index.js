import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateMockResponseBehavior } from 'providers/ReduxStore/slices/collections';
import StyledWrapper from './StyledWrapper';

const EXTRACT_SOURCES = ['query', 'header', 'param', 'body', 'form'];

/**
 * Per-response mock behavior: delay, probability, counter rotation,
 * template rendering and extract rules. Values are held as strings in the
 * editor draft and converted on save (see buildMockResponseFromBehavior).
 */
const MockResponseBehavior = ({ responseUid, editMode }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const editor = useSelector((state) => state.collections.mockResponseEditors[responseUid]);

  if (!editor) {
    return null;
  }

  const example = editor.item?.draft?.examples?.find((entry) => entry.uid === responseUid);
  const behavior = example?.behavior;
  if (!behavior) {
    return null;
  }

  const update = (patch) => {
    dispatch(updateMockResponseBehavior({
      responseUid,
      behavior: { ...behavior, ...patch }
    }));
  };

  const updateExtract = (index, patch) => {
    const extract = behavior.extract.map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
    update({ extract });
  };

  const addExtract = () => {
    update({ extract: [...behavior.extract, { source: 'query', key: '', as: '' }] });
  };

  const removeExtract = (index) => {
    update({ extract: behavior.extract.filter((_, i) => i !== index) });
  };

  return (
    <StyledWrapper className="mock-behavior-panel" editMode={editMode}>
      <div className="behavior-grid">
        <label>
          <span title={t('mockServer.behavior.delayTitle')}>{t('mockServer.behavior.delayLabel')}</span>
          <input
            type="text"
            value={behavior.delay}
            onChange={(e) => update({ delay: e.target.value })}
            disabled={!editMode}
          />
        </label>
        <label>
          <span title={t('mockServer.behavior.probabilityTitle')}>{t('mockServer.behavior.probabilityLabel')}</span>
          <input
            type="text"
            value={behavior.probability}
            onChange={(e) => update({ probability: e.target.value })}
            disabled={!editMode}
          />
        </label>
        <label>
          <span title={t('mockServer.behavior.counterEveryTitle')}>{t('mockServer.behavior.counterEveryLabel')}</span>
          <input
            type="text"
            value={behavior.counterEvery}
            onChange={(e) => update({ counterEvery: e.target.value })}
            disabled={!editMode}
          />
        </label>
        <label>
          <span title={t('mockServer.behavior.counterOffsetTitle')}>{t('mockServer.behavior.counterOffsetLabel')}</span>
          <input
            type="text"
            value={behavior.counterOffset}
            onChange={(e) => update({ counterOffset: e.target.value })}
            disabled={!editMode}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={behavior.template}
            onChange={(e) => update({ template: e.target.checked })}
            disabled={!editMode}
          />
          <span title={t('mockServer.behavior.templateTitle', { tokens: '{{param.x}}, {{query.x}}, {{header.x}}, {{body.x}}, {{form.x}} and {{extract.x}}' })}>{t('mockServer.behavior.templateLabel')}</span>
        </label>
      </div>

      {behavior.extract.length > 0 || editMode ? (
        <div className="extract-section">
          <div className="extract-header">
            <span title={t('mockServer.behavior.extractTitle', { token: '{{extract.name}}' })}>{t('mockServer.behavior.extractLabel')}</span>
            <button type="button" onClick={addExtract} disabled={!editMode}>{t('mockServer.behavior.addExtract')}</button>
          </div>
          {behavior.extract.map((rule, index) => (
            <div className="extract-row" key={index}>
              <select
                value={rule.source}
                onChange={(e) => updateExtract(index, { source: e.target.value })}
                disabled={!editMode}
              >
                {EXTRACT_SOURCES.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t('mockServer.behavior.keyPlaceholder')}
                value={rule.key}
                onChange={(e) => updateExtract(index, { key: e.target.value })}
                disabled={!editMode}
              />
              <input
                type="text"
                placeholder={t('mockServer.behavior.asPlaceholder')}
                value={rule.as}
                onChange={(e) => updateExtract(index, { as: e.target.value })}
                disabled={!editMode}
              />
              <button type="button" onClick={() => removeExtract(index)} disabled={!editMode}>x</button>
            </div>
          ))}
        </div>
      ) : null}
    </StyledWrapper>
  );
};

export default MockResponseBehavior;
