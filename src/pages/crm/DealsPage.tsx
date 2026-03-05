import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DealsPage = () => {
  return (
    <div>
      <PageHeader
        title="Сделки"
        description="Управление на търговски сделки"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нова сделка</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма сделки.</p>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;
