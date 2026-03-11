import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Percent } from "lucide-react";

const CommissionsPage = () => {
  return (
    <div>
      <PageHeader title="Комисионни" description="Проследяване на комисионни по сделки и договори" sopKey="commissions" />
      <div className="p-6">
        <EmptyState icon={Percent} title="Няма комисионни записи" description="Комисионните ще се генерират автоматично при приключване на сделки." />
      </div>
    </div>
  );
};

export default CommissionsPage;
