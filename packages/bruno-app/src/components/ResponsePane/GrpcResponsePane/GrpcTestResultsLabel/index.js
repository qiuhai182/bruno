import React from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const GrpcTestResultsLabel = ({ sections }) => {
  const { t } = useTranslation();
  const results = sections.flatMap((section) => section.results);

  if (!results.length) {
    return t('responsePane.tests.label');
  }

  const failedCount = results.filter((result) => result.status === 'fail').length;

  return (
    <StyledWrapper className="flex items-center">
      <div>{t('responsePane.tests.label')}</div>
      {failedCount ? (
        <sup className="some-tests-failed ml-1 font-medium" data-testid="grpc-tests-failed-count">{failedCount}</sup>
      ) : (
        <sup className="all-tests-passed ml-1 font-medium" data-testid="grpc-tests-passed-count">{results.length}</sup>
      )}
    </StyledWrapper>
  );
};

export default GrpcTestResultsLabel;
