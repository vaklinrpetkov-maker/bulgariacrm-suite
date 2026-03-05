import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ContactsPage = () => {
  return (
    <div>
      <PageHeader
        title="Контакти"
        description="Управление на клиенти и компании"
        actions={<Button><Plus className="mr-2 h-4 w-4" />Нов контакт</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма контакти. Добавете първия контакт.</p>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
