import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <div className="relative rounded-xl border border-border/40 bg-card/50 p-16 text-center overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
