import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type Period = "week" | "month" | "quarter";

interface PeriodSelectorProps {
  value: Period;
  onChange: (value: Period) => void;
}

const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as Period)}
      size="sm"
      variant="outline"
      className="gap-0.5"
    >
      <ToggleGroupItem value="week" className="text-xs px-2.5 h-7 rounded-md">
        Седмица
      </ToggleGroupItem>
      <ToggleGroupItem value="month" className="text-xs px-2.5 h-7 rounded-md">
        Месец
      </ToggleGroupItem>
      <ToggleGroupItem value="quarter" className="text-xs px-2.5 h-7 rounded-md">
        Тримесечие
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default PeriodSelector;
