import PlaygroundDashboard from '@/components/files/PlaygroundDashboard';
import { ProjectSettingsLayout } from '@/components/layouts/ProjectSettingsLayout';

const PlaygroundPage = () => {
  return (
    <ProjectSettingsLayout title="Playground" noHeading>
      <div className="fixed top-[calc(var(--app-navbar-height)+var(--app-tabbar-height))] bottom-0 left-0 right-0">
        <PlaygroundDashboard />
      </div>
    </ProjectSettingsLayout>
  );
};

export default PlaygroundPage;
