import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button/index';
import i18n from '../../../i18n';

class QueryBuilderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[QueryBuilder] Unexpected render error:', error, errorInfo);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <StyledWrapper>
          <div className="schema-empty-state">
            <IconAlertTriangle size={32} strokeWidth={1.5} className="empty-state-icon warning" />
            <div className="empty-state-title">{i18n.t('requestPane.queryBuilder.somethingWentWrong')}</div>
            <div className="empty-state-description">
              {i18n.t('requestPane.queryBuilder.errorBoundaryDescription')}
            </div>
            <Button color="secondary" onClick={this.reset}>
              {i18n.t('requestPane.queryBuilder.tryAgain')}
            </Button>
          </div>
        </StyledWrapper>
      );
    }
    return this.props.children;
  }
}

export default QueryBuilderErrorBoundary;
