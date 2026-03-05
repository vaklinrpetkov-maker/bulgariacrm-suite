import PageHeader from "@/components/PageHeader";

const NotificationsPage = () => {
  return (
    <div>
      <PageHeader title="Известия" description="Вашите известия и напомняния" />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма нови известия.</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
