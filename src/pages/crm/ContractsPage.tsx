import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ContractsPage = () => {
  return (
    <div>
      <PageHeader
        title="Договори"
        description="Управление на договори и плащания (Акт 14/15/16)"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нов договор</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма договори.</p>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
