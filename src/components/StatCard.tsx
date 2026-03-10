import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  emoji: string;
  description?: string;
  trend?: { value: number; positive: boolean };
}

const StatCard = ({ title, value, emoji, description, trend }: StatCardProps) => {
  return (
    <Card className="animate-fade-in stat-card-hover glass border-border/40 relative overflow-hidden group">
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
      <div className="flex flex-col items-center text-center p-4 relative z-10">
        <span className="text-3xl mb-2">{emoji}</span>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
