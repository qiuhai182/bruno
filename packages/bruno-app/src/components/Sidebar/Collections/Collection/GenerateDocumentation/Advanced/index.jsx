import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronRight, IconListCheck, IconGitBranch, IconInfoCircle } from '@tabler/icons';
import { Tooltip } from 'react-tooltip';
import ToggleSwitch from 'components/ToggleSwitch';
import SegmentedControl from 'ui/SegmentedControl';
import IncludeExcludeTags from './IncludeExcludeTags';
import StyledWrapper from './StyledWrapper';

const Advanced = ({
  filterByTags,
  onFilterModeChange,
  tags,
  availableTags,
  onTagsChange,
  includeGitLink,
  onGitLinkToggle,
  hasGitUrl
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const requestsLabelId = useId();

  const tagsHint = t('sidebar.docs.tagsHint');

  const requestModeItems = [
    { 'value': 'all', 'label': t('sidebar.docs.allRequests'), 'className': 'seg-option', 'data-testid': 'docs-requests-all' },
    {
      'value': 'tags',
      'className': 'seg-option',
      'label': (
        <span className="seg-with-hint">
          {t('sidebar.docs.filterByTags')}
          <span className="seg-hint" data-tooltip-id="docs-tags-hint" data-tooltip-content={tagsHint}>
            <IconInfoCircle size={16} aria-hidden="true" />
          </span>
        </span>
      ),
      'data-testid': 'docs-requests-filter'
    }
  ];

  return (
    <StyledWrapper className="advanced">
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        data-testid="docs-advanced-toggle"
      >
        <IconChevronRight className="advanced-chevron" size={16} strokeWidth={1.36} aria-hidden="true" />
        <span className="advanced-label">{t('sidebar.docs.advanced')}</span>
      </button>

      <div className={`advanced-collapse ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
        <div className="advanced-collapse-inner">
          <div className="advanced-body">
            <section className="adv-section">
              <div className="adv-label" id={requestsLabelId}>
                <IconListCheck size={14} className="adv-label-icon" aria-hidden="true" />
                <span>{t('sidebar.docs.requestsToInclude')}</span>
              </div>

              <div className="seg-row">
                <SegmentedControl
                  ariaLabelledBy={requestsLabelId}
                  value={filterByTags ? 'tags' : 'all'}
                  onChange={(value) => onFilterModeChange(value === 'tags')}
                  items={requestModeItems}
                  variant="outlined"
                  size="sm"
                />
              </div>

              <Tooltip id="docs-tags-hint" className="adv-hint-tooltip" />

              {filterByTags && (
                <IncludeExcludeTags
                  className="adv-tags"
                  tags={tags}
                  availableTags={availableTags}
                  onChange={onTagsChange}
                />
              )}
            </section>

            {hasGitUrl && (
              <section className="adv-section" data-testid="docs-git-link">
                <div className="adv-row">
                  <div className="adv-label mb-0">
                    <IconGitBranch size={16} className="adv-label-icon" aria-hidden="true" />
                    <span>Include git repo URL</span>
                  </div>
                  <label className="adv-toggle" data-testid="docs-git-link-toggle">
                    <span className="toggle-label">Show</span>
                    <ToggleSwitch isOn={includeGitLink} handleToggle={onGitLinkToggle} size="xs" />
                  </label>
                </div>
                <p className="adv-desc">Adds the repository link so readers can clone your collection in Bruno.</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Advanced;
