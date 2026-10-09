import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  createMockResponse,
  deleteMockResponse,
  generateMockResponsesFromSpec,
  loadMockResponses,
  loadMockResponsesFromSpec,
  saveMockResponse,
  syncMockResponsesFromExamples
} from 'providers/ReduxStore/slices/mock-server/index';
import { addTab, closeTabs, updateTabMeta } from 'providers/ReduxStore/slices/tabs';
import { removeMockResponseEditor } from 'providers/ReduxStore/slices/collections';
import {
  buildMockServerTryUrl,
  collectCollectionExamples,
  copyExampleToMockResponse,
  resolveMockResponseLocation,
  syncMockResponsesFromExamples as mergeMockResponsesFromExamples,
  syncMockResponsesFromSpec as mergeMockResponsesFromSpec
} from 'utils/mock-server/mock-responses';
import { resolveInstanceSpec } from 'utils/mock-server/mock-server-instances';
import { IconCopy, IconPlus, IconServer2, IconTrash } from '@tabler/icons';
import CreateMockResponseModal from '../CreateMockResponseModal';
import GenerateFromSpecModal from '../GenerateFromSpecModal';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import MockSearchInput from 'components/MockServer/MockSearchInput';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import ListGroup from 'ui/ListGroup';
import StyledWrapper from './StyledWrapper';

const MockResponsesList = ({ instance, collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSpecModal, setShowSyncSpecModal] = useState(false);
  const [isSyncingSpec, setIsSyncingSpec] = useState(false);
  const collections = useSelector((state) => state.collections.collections);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const apiSpecs = useSelector((state) => state.apiSpec.apiSpecs);
  const responses = useSelector((state) => state.mockServer.mockResponses[instance.uid] || []);
  const serverState = useSelector((state) => state.mockServer.servers[instance.uid]);
  const mockServerPort = serverState?.port || instance.port;

  const resolvedCollection = useMemo(() => (
    collection || collections.find((item) => item.uid === instance.collectionUid) || null
  ), [collection, collections, instance.collectionUid]);

  const activeWorkspace = useMemo(() => (
    workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null
  ), [workspaces, activeWorkspaceUid]);

  const location = useMemo(() => (
    resolveMockResponseLocation(instance, workspaces, activeWorkspace)
  ), [instance, workspaces, activeWorkspace]);

  const spec = useMemo(() => (
    resolveInstanceSpec(instance, apiSpecs)
  ), [instance, apiSpecs]);

  useEffect(() => {
    dispatch(loadMockResponses(location));
  }, [dispatch, location.mockServerUid, location.workspacePath]);

  const openResponseTab = (response) => {
    dispatch(addTab({
      uid: response.uid,
      type: 'mock-response',
      mockServerUid: instance.uid,
      collectionUid: resolvedCollection?.uid || instance.collectionUid,
      responseName: response.name,
      tabName: response.name,
      preview: false
    }));
  };

  const handleCreate = async ({ name, description, statusCode, bodyType, exampleSelection }) => {
    try {
      if (exampleSelection) {
        const response = copyExampleToMockResponse(exampleSelection.example, exampleSelection.item);
        response.name = name;
        response.description = description;

        const result = await dispatch(saveMockResponse({
          ...location,
          response
        })).unwrap();

        openResponseTab(result.response);
        toast.success(t('mockServer.responses.createdFromExample'));
        return;
      }

      const result = await dispatch(createMockResponse({
        ...location,
        name,
        description,
        statusCode,
        bodyType
      })).unwrap();

      openResponseTab(result.response);
    } catch (err) {
      toast.error(err.message || t('mockServer.responses.createFailed'));
      // rethrow so CreateMockResponseModal keeps itself open with the entered values
      throw err;
    }
  };

  const handleGenerateFromSpec = () => {
    if (!spec?.pathname) {
      toast.error(t('mockServer.responses.openSpecFirst'));
      return;
    }

    setShowGenerateModal(true);
  };

  const handleConfirmGenerateFromSpec = async ({ generateFromSchema }) => {
    setIsGenerating(true);
    try {
      const result = await dispatch(generateMockResponsesFromSpec({
        ...location,
        specPath: spec.pathname,
        generateFromSchema
      })).unwrap();

      setShowGenerateModal(false);
      toast.success(t('mockServer.responses.generatedFromSpec', { count: result.createdCount, s: result.createdCount === 1 ? '' : 's' }));
    } catch (err) {
      toast.error(err.message || t('mockServer.responses.generateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const isSpecServer = instance.sourceType === 'spec';
  const isCollectionServer = instance.sourceType === 'collection';

  const filteredResponses = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return responses;
    }

    return responses.filter((response) => {
      const name = response.name?.toLowerCase() || '';
      const method = (response.request?.method || 'GET').toLowerCase();
      const url = (response.request?.url || '').toLowerCase();
      return name.includes(normalized) || method.includes(normalized) || url.includes(normalized);
    });
  }, [responses, searchQuery]);

  const handleConfirmSync = async () => {
    if (!resolvedCollection?.items?.length) {
      toast.error(t('mockServer.responses.collectionNotLoaded'));
      return;
    }

    setIsSyncing(true);
    try {
      const exampleEntries = collectCollectionExamples(resolvedCollection);
      const previousNamesByUid = new Map(responses.map((response) => [response.uid, response.name]));
      const nextResponses = mergeMockResponsesFromExamples(responses, exampleEntries);

      await dispatch(syncMockResponsesFromExamples({
        ...location,
        responses: nextResponses
      })).unwrap();

      for (const response of nextResponses) {
        const previousName = previousNamesByUid.get(response.uid);
        if (previousName !== undefined && previousName !== response.name) {
          dispatch(updateTabMeta({
            uid: response.uid,
            tabName: response.name,
            responseName: response.name
          }));
        }
      }

      setShowSyncModal(false);
      toast.success(t('mockServer.responses.syncedWithExamples'));
    } catch (err) {
      toast.error(err.message || t('mockServer.responses.syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncWithSpec = () => {
    if (!spec?.pathname) {
      toast.error(t('mockServer.responses.openSpecFirst'));
      return;
    }

    setShowSyncSpecModal(true);
  };

  const handleConfirmSyncWithSpec = async () => {
    setIsSyncingSpec(true);
    try {
      const { responses: specResponses } = await dispatch(loadMockResponsesFromSpec({
        workspacePath: location.workspacePath,
        specPath: spec.pathname
      })).unwrap();

      const nextResponses = mergeMockResponsesFromSpec(responses, specResponses);

      await dispatch(syncMockResponsesFromExamples({
        ...location,
        responses: nextResponses
      })).unwrap();

      setShowSyncSpecModal(false);
      toast.success(t('mockServer.responses.syncedWithSpec'));
    } catch (err) {
      toast.error(err.message || t('mockServer.responses.syncWithSpecFailed'));
    } finally {
      setIsSyncingSpec(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResponse) {
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteMockResponse({
        ...location,
        responseUid: deletingResponse.uid
      })).unwrap();

      dispatch(closeTabs({ tabUids: [deletingResponse.uid] }));
      dispatch(removeMockResponseEditor({ responseUid: deletingResponse.uid }));
      setDeletingResponse(null);
      toast.success(t('mockServer.responses.deleted'));
    } catch (err) {
      toast.error(err.message || t('mockServer.responses.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = async (response) => {
    try {
      const url = buildMockServerTryUrl({
        port: mockServerPort,
        requestUrl: response.request?.url,
        params: response.request?.params
      });
      await navigator.clipboard.writeText(url);
      toast.success(t('mockServer.responses.urlCopied'));
    } catch {
      toast.error(t('mockServer.responses.copyUrlFailed'));
    }
  };

  return (
    <StyledWrapper>
      {deletingResponse ? (
        <MockConfirmModal
          title={t('mockServer.responses.deleteModalTitle')}
          confirmText={isDeleting ? t('mockServer.responses.deleting') : t('mockServer.delete.label')}
          confirmDisabled={isDeleting}
          confirmButtonColor="danger"
          dataTestId="delete-mock-response-modal"
          onClose={() => {
            if (!isDeleting) {
              setDeletingResponse(null);
            }
          }}
          onConfirm={handleConfirmDelete}
        >
          {t('mockServer.responses.deleteConfirm', { name: deletingResponse?.name })}
        </MockConfirmModal>
      ) : null}

      {showGenerateModal ? (
        <GenerateFromSpecModal
          specName={spec?.name || instance.specPath}
          isGenerating={isGenerating}
          onClose={() => {
            if (!isGenerating) {
              setShowGenerateModal(false);
            }
          }}
          onConfirm={handleConfirmGenerateFromSpec}
        />
      ) : null}

      {showSyncModal ? (
        <MockConfirmModal
          title={t('mockServer.responses.syncExamplesModalTitle')}
          confirmText={isSyncing ? t('mockServer.responses.syncing') : t('mockServer.responses.sync')}
          confirmDisabled={isSyncing}
          dataTestId="sync-mock-examples-modal"
          onClose={() => {
            if (!isSyncing) {
              setShowSyncModal(false);
            }
          }}
          onConfirm={handleConfirmSync}
        >
          <p>
            {t('mockServer.responses.syncExamplesText')}
          </p>
          <p className="mt-3 text-sm opacity-80">
            {t('mockServer.responses.syncExamplesKeepText')}
          </p>
        </MockConfirmModal>
      ) : null}

      {showSyncSpecModal ? (
        <MockConfirmModal
          title={t('mockServer.responses.syncSpecModalTitle')}
          confirmText={isSyncingSpec ? t('mockServer.responses.syncing') : t('mockServer.responses.sync')}
          confirmDisabled={isSyncingSpec}
          dataTestId="mock-response-sync-spec-modal"
          onClose={() => {
            if (!isSyncingSpec) {
              setShowSyncSpecModal(false);
            }
          }}
          onConfirm={handleConfirmSyncWithSpec}
        >
          <p>
            {t('mockServer.responses.syncSpecText', { spec: spec?.name || instance.specPath || t('mockServer.responses.thisSpec') })}
          </p>
          <p className="mt-3 text-sm opacity-80">
            {t('mockServer.responses.syncSpecKeepText')}
          </p>
        </MockConfirmModal>
      ) : null}

      {showCreateModal ? (
        <CreateMockResponseModal
          collection={isSpecServer ? null : resolvedCollection}
          existingResponses={responses}
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}

      <div className="actions">
        <div className="actions-toolbar">
          <Button
            size="sm"
            icon={<IconPlus size={14} stroke={1.75} />}
            onClick={() => setShowCreateModal(true)}
            data-testid="mock-response-create-btn"
          >
            {t('mockServer.responses.newButton')}
          </Button>

          {isCollectionServer ? (
            <Button
              color="secondary"
              size="sm"
              onClick={() => setShowSyncModal(true)}
              disabled={!resolvedCollection}
              data-testid="mock-response-sync-examples-btn"
            >
              {t('mockServer.responses.syncWithExamplesBtn')}
            </Button>
          ) : null}

          {isSpecServer ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleGenerateFromSpec}
              disabled={isGenerating || !spec?.pathname}
              data-testid="mock-response-generate-from-spec-btn"
            >
              {isGenerating ? t('mockServer.generate.generating') : t('mockServer.responses.generateFromSpecBtn')}
            </Button>
          ) : null}

          {isSpecServer && responses.length > 0 ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleSyncWithSpec}
              disabled={!spec?.pathname}
              data-testid="mock-response-sync-spec-btn"
            >
              {t('mockServer.responses.syncWithSpecBtn')}
            </Button>
          ) : null}
        </div>

        {responses.length > 0 ? (
          <MockSearchInput
            className="response-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('mockServer.responses.searchPlaceholder')}
            data-testid="mock-response-search-input"
          />
        ) : null}
      </div>

      <ListGroup
        maxWidth="100%"
        items={filteredResponses}
        getKey={(response) => response.uid}
        emptyState={{
          icon: <IconServer2 size={22} stroke={1.5} aria-hidden="true" />,
          title: responses.length ? t('mockServer.responses.noMatches') : t('mockServer.responses.emptyTitle'),
          text: responses.length
            ? t('mockServer.responses.noMatchText')
            : isSpecServer
              ? t('mockServer.responses.emptySpecText')
              : t('mockServer.responses.emptyText')
        }}
        renderItem={(response) => (
          <ListGroup.Item
            leading={<IconServer2 size={14} stroke={1.5} className="response-item-icon" aria-hidden="true" />}
            actions={(
              <>
                <ActionIcon
                  label={t('mockServer.responses.copyUrlAction')}
                  onClick={() => handleCopyUrl(response)}
                  data-testid={`mock-response-copy-${response.uid}`}
                >
                  <IconCopy size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  label={t('mockServer.responses.deleteAction')}
                  onClick={() => setDeletingResponse(response)}
                  data-testid={`mock-response-delete-${response.uid}`}
                >
                  <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
              </>
            )}
            className="response-item"
          >
            <button
              type="button"
              className="response-item-open"
              onClick={() => openResponseTab(response)}
              data-testid={`mock-response-open-${response.uid}`}
            >
              <div className="response-item-name">{response.name}</div>
              <div className="response-item-endpoint">
                {(response.request?.method || 'GET').toUpperCase()} {response.request?.url}
              </div>
              <div className="response-item-rules">
                {response.rules?.conditions?.length
                  ? t('mockServer.responses.rulesSummary', { count: response.rules.conditions.length, operator: response.rules.operator || 'AND' })
                  : t('mockServer.responses.noRulesDefault')}
              </div>
            </button>
          </ListGroup.Item>
        )}
      />
    </StyledWrapper>
  );
};

export default MockResponsesList;
