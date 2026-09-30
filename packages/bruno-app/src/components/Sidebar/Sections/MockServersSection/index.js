import { useState } from 'react';
import { IconPlus, IconServer } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import SidebarSection from 'components/Sidebar/SidebarSection';
import MockServers from 'components/MockServer/Sidebar/MockServers';
import CreateMockServerModal from 'components/MockServer/CreateMockServerModal';
import ActionIcon from 'ui/ActionIcon';

const MockServersSection = () => {
  const { t } = useTranslation();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const sectionActions = (
    <ActionIcon
      label={t('sidebar.mockServers.createMockServer')}
      onClick={() => setCreateModalOpen(true)}
      data-testid="mock-servers-create-btn"
    >
      <IconPlus size={14} stroke={1.5} aria-hidden="true" />
    </ActionIcon>
  );

  return (
    <>
      {createModalOpen && (
        <CreateMockServerModal onClose={() => setCreateModalOpen(false)} />
      )}
      <SidebarSection
        id="mock-servers"
        title={t('sidebar.sections.mockServers')}
        icon={IconServer}
        actions={sectionActions}
        className="mock-servers-section"
      >
        <MockServers />
      </SidebarSection>
    </>
  );
};

export default MockServersSection;
