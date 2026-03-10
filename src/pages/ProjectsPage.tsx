import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";

const ProjectsPage = () => {
  return (
    <div>
      <PageHeader
        title="Проекти"
        description="Управление на строителни проекти"
        actions={<Button className="gradient-primary shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />Нов проект</Button>}
      />
      <div className="p-6">
        <EmptyState icon={Briefcase} title="Няма проекти" description="Създайте първия си проект за управление на строителните дейности." />
      </div>
    </div>
  );
};

export default ProjectsPage;
