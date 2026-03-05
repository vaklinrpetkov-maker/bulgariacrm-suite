import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const LeadsPage = () => {
  return (
    <div>
      <PageHeader
        title="Лийдове"
        description="Проследяване на потенциални клиенти"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нов лийд</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма лийдове. Създайте нов лийд от контакт.</p>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
