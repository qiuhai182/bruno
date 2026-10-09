import React, { useMemo, useState } from 'react';
import get from 'lodash/get';
import { IconChevronDown, IconExternalLink, IconPlayerPlay } from '@tabler/icons';
import Tab from 'components/Tab';
import HeightBoundContainer from 'ui/HeightBoundContainer';
import Button from 'ui/Button';
import MenuDropdown from 'ui/MenuDropdown';
import ResponseExampleUrlBar from 'components/ResponseExample/ResponseExampleRequestPane/ResponseExampleUrlBar';
import { buildDemoRequestFromRules } from 'utils/mock-server/mock-responses';
import MockResponseRules from '../MockResponseRules';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DemoKeyValueTable = ({ title, rows }) => {
  const { t } = useTranslation();

  return (
    <div className="demo-section">
      <div className="demo-section-title">{title}</div>
      <table className="demo-table w-full">
        <thead>
          <tr>
            <th>{t('mockServer.create.nameLabel')}</th>
            <th>{t('mockServer.rules.colValue')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`}>
              <td>{row.name}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MockResponseRequestPane = ({
  item,
  collection,
  exampleUid,
  editMode,
  onSave,
  rules,
  onRulesChange,
  onTry,
  isTrying,
  isServerRunning,
  onStartServer,
  isStartingServer,
  mockServerPort,
  onOpenAsRequest,
  onEditToggle
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rules');
  const ruleCount = rules?.conditions?.length || 0;

  const exampleRequest = useMemo(() => {
    const examples = item.draft ? get(item, 'draft.examples', []) : get(item, 'examples', []);
    return examples.find((example) => example.uid === exampleUid)?.request || null;
  }, [item, exampleUid]);

  const demoRequest = useMemo(() => (
    buildDemoRequestFromRules(exampleRequest, rules)
  ), [exampleRequest, rules]);

  const tabConfig = [
    { name: 'rules', label: t('mockServer.requestPane.tabRules'), count: ruleCount },
    { name: 'demo-request', label: t('mockServer.requestPane.tabDemoRequest') }
  ];

  const getTabPanel = (tab) => {
    switch (tab) {
      case 'rules':
        return (
          <MockResponseRules
            rules={rules}
            editMode={editMode}
            onChange={onRulesChange}
            onAddRule={onEditToggle}
          />
        );
      case 'demo-request': {
        const hasDetails = demoRequest.headers.length || demoRequest.params.length || demoRequest.body;

        return (
          <div className="demo-request flex flex-col w-full" data-testid="mock-response-demo-request">
            {hasDetails ? (
              <>
                <div className="demo-hint">
                  {t('mockServer.requestPane.demoHint')}
                </div>
                {demoRequest.headers.length ? (
                  <DemoKeyValueTable title={t('mockServer.requestPane.headers')} rows={demoRequest.headers} />
                ) : null}
                {demoRequest.params.length ? (
                  <DemoKeyValueTable title={t('mockServer.requestPane.queryParams')} rows={demoRequest.params} />
                ) : null}
                {demoRequest.body ? (
                  <div className="demo-section">
                    <div className="demo-section-title">{t('mockServer.requestPane.body')}</div>
                    <pre className="demo-body">{demoRequest.body.content}</pre>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="demo-hint">
                {t('mockServer.requestPane.demoHintNoRules', { method: demoRequest.method, url: demoRequest.url })}
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <StyledWrapper className="flex flex-col h-full relative">
      <div className="px-4 try-row">
        <div className="try-url-bar">
          <ResponseExampleUrlBar
            item={item}
            collection={collection}
            exampleUid={exampleUid}
            editMode={editMode}
            onSave={onSave}
            allowMethodSelect
            urlPrefix={mockServerPort ? `localhost:${mockServerPort}` : null}
            highlightPathParams={false}
          />
        </div>
        <div className="try-action">
          {isServerRunning ? (
            <Button
              color="secondary"
              className="try-main"
              onClick={onTry}
              disabled={isTrying}
              data-testid="mock-response-try-btn"
            >
              {isTrying ? t('mockServer.requestPane.trying') : t('mockServer.requestPane.try')}
            </Button>
          ) : (
            <Button
              color="secondary"
              className="try-main"
              icon={<IconPlayerPlay size={14} stroke={1.5} />}
              onClick={onStartServer}
              disabled={isStartingServer}
              title={t('mockServer.requestPane.startServerTitle')}
              data-testid="mock-response-start-server-btn"
            >
              {isStartingServer ? t('mockServer.dashboard.starting') : t('mockServer.dashboard.startServer')}
            </Button>
          )}
          <MenuDropdown
            items={[
              {
                id: 'open-as-request',
                leftSection: IconExternalLink,
                label: t('mockServer.requestPane.openAsRequest'),
                testId: 'mock-response-open-as-request',
                onClick: onOpenAsRequest
              }
            ]}
            placement="bottom-end"
          >
            <Button
              color="secondary"
              className="try-caret"
              icon={<IconChevronDown size={14} stroke={1.5} />}
              aria-label={t('mockServer.requestPane.moreTryOptions')}
              data-testid="mock-response-try-options-btn"
            />
          </MenuDropdown>
        </div>
      </div>

      <div className="flex flex-wrap items-center tabs mb-4 px-4" role="tablist">
        {tabConfig.map((tab) => (
          <Tab
            key={tab.name}
            name={tab.name}
            label={tab.label}
            isActive={activeTab === tab.name}
            onClick={setActiveTab}
            count={tab.count}
          />
        ))}
      </div>

      <section className="flex w-full flex-1 relative px-4">
        <HeightBoundContainer>
          {getTabPanel(activeTab)}
        </HeightBoundContainer>
      </section>
    </StyledWrapper>
  );
};

export default MockResponseRequestPane;
