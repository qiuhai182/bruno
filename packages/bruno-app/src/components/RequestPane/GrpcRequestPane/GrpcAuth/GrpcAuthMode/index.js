import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useDispatch } from 'react-redux';
import { updateRequestAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from '../../../Auth/AuthMode/StyledWrapper';

const GrpcAuthMode = ({ item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authMode = item.draft ? get(item, 'draft.request.auth.mode') : get(item, 'request.auth.mode');

  const onModeChange = useCallback((value) => {
    dispatch(
      updateRequestAuthMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const menuItems = useMemo(() => [
    {
      id: 'basic',
      label: t('requestPane.grpc.authMode.basic'),
      onClick: () => onModeChange('basic')
    },
    {
      id: 'bearer',
      label: t('requestPane.grpc.authMode.bearer'),
      onClick: () => onModeChange('bearer')
    },
    {
      id: 'apikey',
      label: t('requestPane.grpc.authMode.apikey'),
      onClick: () => onModeChange('apikey')
    },
    {
      id: 'oauth2',
      label: t('requestPane.grpc.authMode.oauth2'),
      onClick: () => onModeChange('oauth2')
    },
    {
      id: 'wsse',
      label: t('requestPane.grpc.authMode.wsse'),
      onClick: () => onModeChange('wsse')
    },
    {
      id: 'inherit',
      label: t('requestPane.grpc.authMode.inherit'),
      onClick: () => onModeChange('inherit')
    },
    {
      id: 'none',
      label: t('requestPane.grpc.authMode.none'),
      onClick: () => onModeChange('none')
    }
  ], [onModeChange, t]);

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer auth-mode-selector" data-testid="auth-mode-selector">
        <MenuDropdown
          items={menuItems}
          placement="bottom-end"
          selectedItemId={authMode}
          showTickMark={true}
        >
          <div className="flex items-center justify-center auth-mode-label select-none" data-testid="auth-mode-label">
            {humanizeRequestAuthMode(authMode)} <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};

export default GrpcAuthMode;
