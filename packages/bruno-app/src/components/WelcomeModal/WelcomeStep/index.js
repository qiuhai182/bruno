import React from 'react';
import {
  IconFolder as IconFolderTabler,
  IconGitFork,
  IconLock,
  IconRocket
} from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const highlights = [
  {
    icon: IconFolderTabler,
    titleKey: 'welcome.highlights.filesystem.title',
    descKey: 'welcome.highlights.filesystem.desc'
  },
  {
    icon: IconGitFork,
    titleKey: 'welcome.highlights.git.title',
    descKey: 'welcome.highlights.git.desc'
  },
  {
    icon: IconLock,
    titleKey: 'welcome.highlights.privacy.title',
    descKey: 'welcome.highlights.privacy.desc'
  },
  {
    icon: IconRocket,
    titleKey: 'welcome.highlights.fast.title',
    descKey: 'welcome.highlights.fast.desc'
  }
];

const WelcomeStep = () => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className="step-body">
      <div className="highlights">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.titleKey} className="highlight-item">
              <div className="highlight-icon">
                <Icon size={18} stroke={1.5} />
              </div>
              <div>
                <div className="highlight-title">{t(item.titleKey)}</div>
                <div className="highlight-desc">{t(item.descKey)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </StyledWrapper>
  );
};

export default WelcomeStep;
