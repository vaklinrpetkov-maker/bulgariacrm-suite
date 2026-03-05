import PageHeader from "@/components/PageHeader";

const CommissionsPage = () => {
  return (
    <div>
      <PageHeader title="Комисионни" description="Проследяване на комисионни по сделки и договори" />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма комисионни записи.</p>
        </div>
      </div>
    </div>
  );
};

export default CommissionsPage;
