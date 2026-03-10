import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CheckSquare } from "lucide-react";

const TasksPage = () => {
  return (
    <div>
      <PageHeader
        title="Задачи"
        description="Ежедневни задачи и операции"
        actions={<Button className="gradient-primary shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />Нова задача</Button>}
      />
      <div className="p-6">
        <EmptyState icon={CheckSquare} title="Няма задачи" description="Създайте първата си задача, за да започнете да проследявате работата си." />
      </div>
    </div>
  );
};

export default TasksPage;
