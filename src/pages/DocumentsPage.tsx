import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DocumentsPage = () => {
  return (
    <div>
      <PageHeader
        title="Документи"
        description="Хранилище за документи, процеси и SOP"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Качване</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма качени документи.</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
