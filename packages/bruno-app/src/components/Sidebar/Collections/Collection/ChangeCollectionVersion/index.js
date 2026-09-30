import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconAlertTriangle } from '@tabler/icons';

import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { findCollectionByUid, getCollectionVersion, isOpenCollectionFormat } from 'utils/collections/index';
import { saveCollectionVersion } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper, { ModalTitle } from './StyledWrapper';

const CollectionNotFound = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal size="sm" title={t('sidebar.changeVersion.title')} confirmText={t('common.close')} handleConfirm={onClose} hideCancel>
        <StyledWrapper className="w-[480px]">
          <div className="flex items-center gap-2 text-warning">
            <IconAlertTriangle size={16} className="shrink-0" />
            <span>{t('sidebar.changeVersion.notFound')}</span>
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

const ChangeCollectionVersion = ({ collectionUid, onClose }) => {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  const currentVersion = getCollectionVersion(collection);
  const isYml = isOpenCollectionFormat(collection);
  const targetKey = isYml ? 'info.version' : 'collectionVersion';
  const targetFile = isYml ? 'opencollection.yml' : 'bruno.json';
  const [newVersion, setNewVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const trimmedVersion = newVersion.trim();
  const canSubmit = useMemo(
    () => trimmedVersion.length > 0 && trimmedVersion !== currentVersion,
    [trimmedVersion, currentVersion]
  );

  const handleConfirm = () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    dispatch(saveCollectionVersion(collectionUid, trimmedVersion))
      .then(() => onClose())
      .catch(() => setIsSaving(false));
  };

  if (!collection) {
    return <CollectionNotFound onClose={onClose} />;
  }

  return (
    <Portal>
      <Modal
        size="md"
        customHeader={<ModalTitle>{t('sidebar.changeVersion.title')}</ModalTitle>}
        confirmText={isSaving ? t('sidebar.changeVersion.updating') : t('sidebar.changeVersion.updateVersion')}
        cancelText={t('common.cancel')}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        confirmDisabled={!canSubmit || isSaving}
        dataTestId="change-version"
      >
        <StyledWrapper className="w-[560px]">
          <div className="subheader" data-testid="change-version-collection">
            {t('sidebar.changeVersion.collectionLabel')}
            <span className="collection-name">{collection.name}</span>
          </div>

          <div className="version-card">
            <div className="version-row">
              <div className="version-col">
                <div className="col-label">{t('sidebar.changeVersion.currentVersion')}</div>
                <div className="current-value" data-testid="change-version-current">
                  {currentVersion || <span className="text-muted italic">{t('sidebar.changeVersion.notSet')}</span>}
                </div>
              </div>

              <IconArrowRight size={18} className="arrow" stroke={1.5} />

              <div className="version-col">
                <div className="col-label">{t('sidebar.changeVersion.newVersion')}</div>
                <input
                  ref={inputRef}
                  type="text"
                  className="textbox w-full new-version-input"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder={t('sidebar.changeVersion.versionPlaceholder')}
                  maxLength={50}
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  data-testid="change-version-input"
                />
              </div>
            </div>

            <p className="preview m-0" data-testid="change-version-preview">
              {t('sidebar.changeVersion.updates')} <strong>{targetKey}</strong> {t('sidebar.changeVersion.in')} {targetFile} {t('sidebar.changeVersion.from')}
              <span className="old">{currentVersion || <span className="text-muted italic not-set">({t('sidebar.changeVersion.notSet')})</span>}</span>
              <IconArrowRight size={13} className="preview-arrow" stroke={1.5} />
              <span className="new">{trimmedVersion || '…'}</span>
            </p>
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

export default ChangeCollectionVersion;
