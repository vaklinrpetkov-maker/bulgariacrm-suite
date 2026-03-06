import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

interface LeadMessageHoverCardProps {
  notes: string | null;
  children: React.ReactNode;
}

export default function LeadMessageHoverCard({ notes, children }: LeadMessageHoverCardProps) {
  if (!notes) return <>{children}</>;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help border-b border-dotted border-muted-foreground/40 inline-flex items-center gap-1">
          {children}
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-full max-w-2xl" side="top">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Съобщение от имейл</p>
          <ScrollArea className="max-h-48">
            <p className="text-sm whitespace-pre-wrap break-words">{notes}</p>
          </ScrollArea>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
