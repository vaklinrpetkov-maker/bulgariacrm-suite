import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Users, Target, Handshake, FileText, Building, CheckSquare } from "lucide-react";

const Dashboard = () => {
  return (
    <div>
      <PageHeader title="Табло" description="Преглед на ключови показатели" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard title="Контакти" value={0} icon={Users} description="Общо контакти" />
          <StatCard title="Активни лийдове" value={0} icon={Target} description="Текущи лийдове" />
          <StatCard title="Сделки" value={0} icon={Handshake} description="В процес на договаряне" />
          <StatCard title="Договори" value={0} icon={FileText} description="Активни договори" />
          <StatCard title="Имоти" value={0} icon={Building} description="Свободни единици" />
          <StatCard title="Задачи" value={0} icon={CheckSquare} description="Чакащи задачи" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
