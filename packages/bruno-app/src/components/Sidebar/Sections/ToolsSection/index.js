import { IconTool } from '@tabler/icons';
import SidebarSection from 'components/Sidebar/SidebarSection';
import Tools from 'components/Tools';

const ToolsSection = () => {
  return (
    <SidebarSection
      id="tools"
      title="Tools"
      icon={IconTool}
      className="tools-section"
    >
      <Tools />
    </SidebarSection>
  );
};

export default ToolsSection;
