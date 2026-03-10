import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Wallet } from "lucide-react";

const BudgetsPage = () => {
  return (
    <div>
      <PageHeader title="Бюджети" description="Планирани vs. реални разходи" />
      <div className="p-6">
        <EmptyState icon={Wallet} title="Няма бюджетни записи" description="Създайте бюджет за проследяване на планирани и реални разходи." />
      </div>
    </div>
  );
};

export default BudgetsPage;
