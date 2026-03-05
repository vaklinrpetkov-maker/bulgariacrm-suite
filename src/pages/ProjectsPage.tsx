import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ProjectsPage = () => {
  return (
    <div>
      <PageHeader
        title="Проекти"
        description="Управление на строителни проекти"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нов проект</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма проекти.</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
