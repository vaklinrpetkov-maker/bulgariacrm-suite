import PageHeader from "@/components/PageHeader";

const WorkflowsPage = () => {
  return (
    <div>
      <PageHeader title="Работни потоци" description="Конфигуриране и управление на работни потоци" />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма дефинирани работни потоци.</p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;
