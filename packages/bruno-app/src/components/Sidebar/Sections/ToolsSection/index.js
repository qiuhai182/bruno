import { IconTool } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import SidebarSection from 'components/Sidebar/SidebarSection';
import Tools from 'components/Tools';

const ToolsSection = () => {
  const { t } = useTranslation();
  return (
    <SidebarSection
      id="tools"
      title={t('sidebar.sections.tools')}
      icon={IconTool}
      className="tools-section"
    >
      <Tools />
    </SidebarSection>
  );
};

export default ToolsSection;
