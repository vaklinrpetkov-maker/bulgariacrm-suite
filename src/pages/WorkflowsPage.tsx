import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Workflow } from "lucide-react";

const WorkflowsPage = () => {
  return (
    <div>
      <PageHeader title="Работни потоци" description="Конфигуриране и управление на работни потоци" sopKey="workflows" />
      <div className="p-6">
        <EmptyState icon={Workflow} title="Няма работни потоци" description="Дефинирайте автоматизирани процеси за управление на дейностите." />
      </div>
    </div>
  );
};

export default WorkflowsPage;
