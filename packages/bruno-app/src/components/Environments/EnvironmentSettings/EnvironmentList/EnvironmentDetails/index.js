import { IconCopy, IconEdit, IconTrash, IconCheck, IconX, IconSearch, IconDeviceFloppy } from '@tabler/icons';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolveEnvironmentInheritance } from '@usebruno/common/utils';
import { renameEnvironment, saveEnvironmentExtends, updateEnvironmentColor } from 'providers/ReduxStore/slices/collections/actions';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import CopyEnvironment from 'components/Environments/EnvironmentSettings/CopyEnvironment';
import DeleteEnvironment from 'components/Environments/EnvironmentSettings/DeleteEnvironment';
import EnvironmentVariables from './EnvironmentVariables';
import InheritsFrom from 'components/Environments/Common/InheritsFrom';
import EnvironmentInheritanceWarning from 'components/Environments/Common/EnvironmentInheritanceWarning';
import ColorPicker from 'components/ColorPicker';
import ActionIcon from 'ui/ActionIcon';
import ResponsiveTabs from 'ui/ResponsiveTabs';
import { updateTabState } from 'providers/ReduxStore/slices/tabs';
import useEnvironmentTabs from 'hooks/useEnvironmentTabs';
import StyledWrapper from './StyledWrapper';

const EnvironmentDetails = ({ environment, setIsModified, collection, searchQuery, setSearchQuery, isSearchExpanded, setIsSearchExpanded, debouncedSearchQuery, searchInputRef }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const environments = collection?.environments || [];

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const activeTab = useSelector((state) => state.tabs.tabs.find((t) => t.uid === activeTabUid)?.tabState?.environment?.tab) || 'variables';
  const setActiveTab = (tab) => dispatch(updateTabState({ uid: activeTabUid, tabState: { environment: { tab } } }));

  const environmentsDraft = collection?.environmentsDraft;

  const inheritedEnvironmentVariables = useMemo(() => {
    const draft = environmentsDraft?.environmentUid === environment.uid ? environmentsDraft : null;
    const liveEnvironment = { ...environment, variables: draft?.variables || environment.variables || [] };
    const { inheritedVariables } = resolveEnvironmentInheritance({
      environments: collection?.environments || [],
      targetEnvironment: liveEnvironment
    });
    return inheritedVariables;
  }, [environment, environmentsDraft, collection?.environments]);

  const tabs = useEnvironmentTabs({ environment, draft: environmentsDraft, inheritedEnvironmentVariables });

  const inheritedEnvironmentVariablesForActiveTab = useMemo(
    () => inheritedEnvironmentVariables.filter((variable) => !!variable.secret === (activeTab === 'secrets')),
    [inheritedEnvironmentVariables, activeTab]
  );

  // Use the immediate query on a tab switch (debounced value lags and briefly
  // flashes the unfiltered table).
  const prevTabRef = useRef(activeTab);
  const tabJustChanged = prevTabRef.current !== activeTab;
  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);
  const tableSearchQuery = tabJustChanged ? searchQuery : debouncedSearchQuery;

  const inputRef = useRef(null);
  const rightContentRef = useRef(null);

  const validateEnvironmentName = (name) => {
    if (!name || name.trim() === '') {
      return t('environments.validation.nameRequired');
    }

    if (name.length < 1) {
      return t('environments.validation.minOneChar');
    }

    if (name.length > 255) {
      return t('environments.validation.maxTwoFiftyFive');
    }

    if (!validateName(name)) {
      return validateNameError(name);
    }

    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = (environments || []).some(
      (env) => env?.uid !== environment.uid && env?.name?.toLowerCase().trim() === trimmedName
    );
    if (isDuplicate) {
      return t('environments.validation.alreadyExists');
    }

    return null;
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
    setNewName(environment.name);
    setNameError('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = () => {
    const error = validateEnvironmentName(newName);
    if (error) {
      setNameError(error);
      return;
    }

    dispatch(renameEnvironment(newName, environment.uid, collection.uid))
      .then(() => {
        toast.success(t('environments.toast.renameSuccess'));
        setIsRenaming(false);
        setNewName('');
        setNameError('');
      })
      .catch(() => {
        toast.error(t('environments.toast.renameError'));
      });
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName('');
    setNameError('');
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleNameBlur = () => {
    if (newName.trim() === '') {
      handleCancelRename();
    } else {
      const error = validateEnvironmentName(newName);
      if (error) {
        setNameError(error);
      }
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSearchBlur = () => {
    if (searchQuery === '') {
      setIsSearchExpanded(false);
    }
  };

  const handleColorChange = (color) => {
    dispatch(updateEnvironmentColor(environment.uid, color, collection.uid));
  };

  const handleExtendsChange = (inheritedEnvironmentName) => {
    dispatch(saveEnvironmentExtends({ environmentUid: environment.uid, inheritedEnvironmentName, collectionUid: collection.uid }))
      .then(() => {
        toast.success(
          inheritedEnvironmentName
            ? t('environments.toast.inheritingFrom', { name: inheritedEnvironmentName })
            : t('environments.toast.stoppedInheriting')
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error(t('environments.toast.saveInheritError'));
      });
  };

  const handleSaveAll = () => {
    window.dispatchEvent(new Event('environment-save-all'));
  };

  return (
    <StyledWrapper>
      {openDeleteModal && (
        <DeleteEnvironment onClose={() => setOpenDeleteModal(false)} environment={environment} collection={collection} />
      )}
      {openCopyModal && (
        <CopyEnvironment onClose={() => setOpenCopyModal(false)} environment={environment} collection={collection} />
      )}

      <div className="header">
        <div className={`title-container ${isRenaming ? 'renaming' : ''}`}>
          {isRenaming ? (
            <>
              <input
                ref={inputRef}
                type="text"
                className="title-input"
                data-testid="env-rename-input"
                value={newName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <div className="inline-actions">
                <button
                  className="inline-action-btn save"
                  onClick={handleSaveRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title={t('common.save')}
                >
                  <IconCheck size={14} strokeWidth={2} />
                </button>
                <button
                  className="inline-action-btn cancel"
                  onClick={handleCancelRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title={t('common.cancel')}
                >
                  <IconX size={14} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="title" data-testid="env-details-title">{environment.name}</h2>
              <ColorPicker color={environment.color} onChange={handleColorChange} />
            </div>
          )}
        </div>
        {nameError && isRenaming && <div className="title-error">{nameError}</div>}
        <div className="actions">
          <InheritsFrom
            environment={environment}
            environments={environments}
            inheritedEnvironmentName={environment.extends}
            onChange={handleExtendsChange}
          />
          <ActionIcon label={t('environments.action.saveAll')} onClick={handleSaveAll} data-testid="save-all-env">
            <IconDeviceFloppy size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('environments.action.rename')} onClick={handleRenameClick} data-testid="env-rename-action">
            <IconEdit size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('environments.action.copy')} onClick={() => setOpenCopyModal(true)} data-testid="env-copy-action">
            <IconCopy size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('common.delete')} onClick={() => setOpenDeleteModal(true)} colorOnHover="danger" data-testid="env-delete-action">
            <IconTrash size={15} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>

      <EnvironmentInheritanceWarning environment={environment} environments={environments} />

      <div className="tabs-container">
        <ResponsiveTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          rightContent={(
            <div ref={rightContentRef} className="env-search-container">
              {isSearchExpanded ? (
                <div className="search-input-wrapper">
                  <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={activeTab === 'secrets' ? t('environments.searchSecretsPlaceholder') : t('environments.searchVariablesPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={handleSearchBlur}
                    className="search-input"
                    data-testid="env-search-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search"
                      onClick={handleClearSearch}
                      onMouseDown={(e) => e.preventDefault()}
                      title={t('environments.clearSearch')}
                      data-testid="env-clear-search"
                    >
                      <IconX size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ) : (
                <ActionIcon label={t('environments.action.search')} onClick={handleSearchIconClick} data-testid="env-search-action">
                  <IconSearch size={15} strokeWidth={1.5} />
                </ActionIcon>
              )}
            </div>
          )}
          rightContentRef={rightContentRef}
        />
      </div>

      <div className="content">
        <EnvironmentVariables
          environment={environment}
          setIsModified={setIsModified}
          collection={collection}
          inheritedEnvironmentVariables={inheritedEnvironmentVariablesForActiveTab}
          searchQuery={tableSearchQuery}
          variableType={activeTab}
        />
      </div>
    </StyledWrapper>
  );
};

export default EnvironmentDetails;
