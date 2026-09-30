import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import StatusBadge from 'ui/StatusBadge/index';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateFolderAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const AuthMode = ({ collection, folder }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authMode = folder.draft ? get(folder, 'draft.request.auth.mode') : get(folder, 'root.request.auth.mode');

  const onModeChange = useCallback((value) => {
    dispatch(
      updateFolderAuthMode({
        mode: value,
        collectionUid: collection.uid,
        folderUid: folder.uid
      })
    );
  }, [dispatch, collection.uid, folder.uid]);

  const menuItems = useMemo(() => [
    {
      id: 'awsv4',
      label: t('collection.auth.mode.awsv4'),
      onClick: () => onModeChange('awsv4')
    },
    {
      id: 'basic',
      label: t('collection.auth.mode.basic'),
      onClick: () => onModeChange('basic')
    },
    {
      id: 'bearer',
      label: t('collection.auth.mode.bearer'),
      onClick: () => onModeChange('bearer')
    },
    {
      id: 'digest',
      label: t('collection.auth.mode.digest'),
      onClick: () => onModeChange('digest')
    },
    {
      id: 'ntlm',
      label: t('collection.auth.mode.ntlm'),
      onClick: () => onModeChange('ntlm')
    },
    {
      id: 'oauth1',
      label: t('collection.auth.mode.oauth1'),
      onClick: () => onModeChange('oauth1')
    },
    {
      id: 'oauth2',
      label: t('collection.auth.mode.oauth2'),
      onClick: () => onModeChange('oauth2')
    },
    {
      id: 'wsse',
      label: t('collection.auth.mode.wsse'),
      onClick: () => onModeChange('wsse')
    },
    {
      id: 'apikey',
      label: t('collection.auth.mode.apikey'),
      onClick: () => onModeChange('apikey')
    },
    {
      id: 'akamai-edgegrid',
      label: (
        <span className="flex items-center gap-2">
          {t('collection.auth.mode.akamaiEdgegrid')}
          <StatusBadge status="info" size="xs">Beta</StatusBadge>
        </span>
      ),
      ariaLabel: t('collection.auth.mode.akamaiEdgegridAria'),
      onClick: () => onModeChange('akamai-edgegrid')
    },
    {
      id: 'inherit',
      label: t('collection.auth.mode.inherit'),
      onClick: () => onModeChange('inherit')
    },
    {
      id: 'none',
      label: t('collection.auth.mode.none'),
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
          data-testid="auth-mode-dropdown"
        >
          <div className="flex items-center justify-center auth-mode-label select-none" data-testid="auth-mode-label">
            {humanizeRequestAuthMode(authMode)} <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};

export default AuthMode;
