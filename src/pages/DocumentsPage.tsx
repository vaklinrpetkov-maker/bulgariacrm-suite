import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

const DocumentsPage = () => {
  return (
    <div>
      <PageHeader
        title="Документи"
        description="Хранилище за документи, процеси и SOP"
        sopKey="documents"
        actions={<Button className="gradient-primary shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />Качване</Button>}
      />
      <div className="p-6">
        <EmptyState icon={FolderOpen} title="Няма документи" description="Качете документи и организирайте ги по папки за лесен достъп." />
      </div>
    </div>
  );
};

export default DocumentsPage;
