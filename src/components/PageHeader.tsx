import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  return (
    <div className="relative flex items-center justify-between border-b border-border/60 px-6 py-5 overflow-hidden">
      {/* Subtle mesh gradient background */}
      <div className="absolute inset-0 gradient-mesh opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="relative z-10 flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
