import PageHeader from "@/components/PageHeader";

const BudgetsPage = () => {
  return (
    <div>
      <PageHeader title="Бюджети" description="Планирани vs. реални разходи" />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма бюджетни записи.</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;
