import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
}

const StatCard = ({ title, value, icon: Icon, description, trend }: StatCardProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight font-mono">{value}</div>
        {description && (
          <p className="mt-1 text-[10px] text-muted-foreground tracking-wide">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
