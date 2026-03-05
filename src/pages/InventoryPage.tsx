import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const InventoryPage = () => {
  return (
    <div>
      <PageHeader
        title="Имоти"
        description="Комплекси → Сгради → Единици"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нов комплекс</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма добавени комплекси. Създайте първия комплекс.</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
