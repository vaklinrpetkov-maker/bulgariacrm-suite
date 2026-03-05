import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const MeetingsPage = () => {
  return (
    <div>
      <PageHeader
        title="Срещи"
        description="Календар и управление на срещи"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нова среща</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма насрочени срещи.</p>
          <p className="mt-2 text-xs text-muted-foreground">Синхронизация с Google Calendar / Outlook — очаквайте скоро</p>
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage;
