import React from 'react';
import { useTranslation } from 'react-i18next';
import DocsTagList from '../DocsTagList';
import StyledWrapper from './StyledWrapper';

const IncludeExcludeTags = ({
  tags = { include: [], exclude: [] },
  availableTags = [],
  onChange,
  className = ''
}) => {
  const { t } = useTranslation();
  const include = tags.include || [];
  const exclude = tags.exclude || [];
  const tagsHintList = availableTags.filter((tag) => !exclude.includes(tag) && !include.includes(tag));

  const handleValidation = (tag) => {
    const trimmedTag = tag.trim();
    if (!availableTags.includes(trimmedTag)) {
      return t('sidebar.docs.tagDoesNotExist');
    }
    if (include.includes(trimmedTag)) {
      return t('sidebar.docs.tagInInclude');
    }
    if (exclude.includes(trimmedTag)) {
      return t('sidebar.docs.tagInExclude');
    }
  };

  const handleAddTag = (tag, to) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (include.includes(trimmedTag) || exclude.includes(trimmedTag)) return;
    if (!availableTags.includes(trimmedTag)) return;
    onChange({ include, exclude, [to]: [...tags[to], trimmedTag].sort() });
  };

  const handleRemoveTag = (tag, from) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (!tags[from].includes(trimmedTag)) return;
    onChange({ include, exclude, [from]: tags[from].filter((existing) => existing !== trimmedTag) });
  };

  return (
    <StyledWrapper className={className}>
      <div className="tags-columns">
        <div className="tags-column">
          <span className="tags-label">{t('sidebar.docs.includeTags')}</span>
          <DocsTagList
            tags={include}
            tagsHintList={tagsHintList}
            handleAddTag={(tag) => handleAddTag(tag, 'include')}
            handleRemoveTag={(tag) => handleRemoveTag(tag, 'include')}
            handleValidation={handleValidation}
            ariaLabel={t('sidebar.docs.includeTags')}
            placeholder={t('sidebar.docs.includePlaceholder')}
          />
        </div>
        <div className="tags-column">
          <span className="tags-label">{t('sidebar.docs.excludeTags')}</span>
          <DocsTagList
            tags={exclude}
            tagsHintList={tagsHintList}
            handleAddTag={(tag) => handleAddTag(tag, 'exclude')}
            handleRemoveTag={(tag) => handleRemoveTag(tag, 'exclude')}
            handleValidation={handleValidation}
            ariaLabel={t('sidebar.docs.excludeTags')}
            placeholder={t('sidebar.docs.excludePlaceholder')}
          />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default IncludeExcludeTags;
