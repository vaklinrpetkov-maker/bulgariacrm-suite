import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  emoji: string;
  description?: string;
  trend?: { value: number; positive: boolean };
}

const StatCard = ({ title, value, emoji, description }: StatCardProps) => {
  return (
    <Card className="animate-fade-in dash-stat-card glass border-border/40 group">
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors duration-500" />
      <div className="flex flex-col items-center text-center p-4 relative z-10">
        <span className="text-3xl mb-2">{emoji}</span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{title}</p>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
