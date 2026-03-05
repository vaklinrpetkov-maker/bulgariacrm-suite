import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const TasksPage = () => {
  return (
    <div>
      <PageHeader
        title="Задачи"
        description="Ежедневни задачи и операции"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нова задача</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма задачи.</p>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
