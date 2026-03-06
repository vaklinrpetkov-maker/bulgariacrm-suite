import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadResponseTimerProps {
  createdAt: string;
  respondedAt: string | null;
  onStop?: () => void;
  compact?: boolean;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
  if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
  if (minutes > 0) return `${minutes}м ${seconds}с`;
  return `${seconds}с`;
}

function getTimerColor(elapsedMs: number, isRunning: boolean) {
  if (!isRunning) return { icon: "text-muted-foreground", text: "text-muted-foreground" };
  const minutes = elapsedMs / 60000;
  if (minutes <= 30) return { icon: "text-success", text: "text-success" };
  if (minutes <= 120) return { icon: "text-warning", text: "text-warning" };
  return { icon: "text-destructive", text: "text-destructive" };
}

export default function LeadResponseTimer({ createdAt, respondedAt, onStop, compact }: LeadResponseTimerProps) {
  const [now, setNow] = useState(Date.now());
  const isRunning = !respondedAt;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = new Date(createdAt).getTime();
  const end = respondedAt ? new Date(respondedAt).getTime() : now;
  const elapsed = Math.max(0, end - start);
  const colors = getTimerColor(elapsed, isRunning);

  return (
    <div className="flex items-center gap-1.5">
      <Timer className={cn("h-3.5 w-3.5", colors.icon, isRunning && "animate-pulse")} />
      <span className={cn(
        "text-xs font-mono tabular-nums",
        colors.text,
        isRunning && "font-semibold"
      )}>
        {formatDuration(elapsed)}
      </span>
      {isRunning && onStop && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onStop(); }}
          title="Спри таймера"
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      )}
    </div>
  );
}