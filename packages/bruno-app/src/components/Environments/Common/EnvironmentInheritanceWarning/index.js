import { memo, useMemo } from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import { getInheritedEnvironments } from '@usebruno/common/utils';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const EnvironmentInheritanceWarning = ({ environment, environments }) => {
  const { t } = useTranslation();
  const { missingInheritedEnvironmentName, cyclicInheritancePath } = getInheritedEnvironments({ environments: environments || [], environment });

  const warning = useMemo(() => {
    if (missingInheritedEnvironmentName) {
      return {
        testId: 'env-missing-inherited-environment',
        content: t('environments.inheritance.missingParent', { name: missingInheritedEnvironmentName })
      };
    }

    if (cyclicInheritancePath) {
      return {
        testId: 'env-cyclic-inherited-environment',
        content: t('environments.inheritance.circular', { path: cyclicInheritancePath.join(' \u2192 ') })
      };
    }

    return null;
  }, [missingInheritedEnvironmentName, cyclicInheritancePath, t]);

  if (!warning) {
    return null;
  }

  return (
    <StyledWrapper data-testid={warning.testId}>
      <IconAlertTriangle size={16} strokeWidth={1.5} className="warning-icon" />
      <span>{warning.content}</span>
    </StyledWrapper>
  );
};

export default memo(EnvironmentInheritanceWarning);
