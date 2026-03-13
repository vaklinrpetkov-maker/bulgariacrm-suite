import { useState } from "react";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ColumnFilterProps {
  title: string;
  columnKey: string;
  values: string[];
  selected: Set<string> | undefined;
  onToggle: (columnKey: string, value: string) => void;
  onSetFilter: (columnKey: string, values: Set<string>) => void;
  onClear: (columnKey: string) => void;
}

export function ColumnFilter({ title, columnKey, values, selected, onToggle, onSetFilter, onClear }: ColumnFilterProps) {
  const [search, setSearch] = useState("");
  const isActive = selected && selected.size > 0;

  const filtered = search
    ? values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : values;

  const selectAll = () => {
    onSetFilter(columnKey, new Set(filtered));
  };

  const clearAll = () => {
    onClear(columnKey);
    setSearch("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground transition-colors",
            isActive ? "text-primary font-semibold" : "text-muted-foreground"
          )}
        >
          <span className="text-xs font-medium">{title}</span>
          <Filter className={cn("h-3 w-3", isActive && "fill-primary")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Търсене..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>
            Всички
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearAll}>
            Изчисти
          </Button>
        </div>
        <ScrollArea className="max-h-48">
          <div className="p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Няма резултати</p>
            ) : (
              filtered.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected?.has(val) || false}
                    onCheckedChange={() => onToggle(columnKey, val)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs truncate">{val}</span>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface FilterableTableHeadProps {
  title: string;
  columnKey: string;
  values: string[];
  selected: Set<string> | undefined;
  onToggle: (columnKey: string, value: string) => void;
  onSetFilter: (columnKey: string, values: Set<string>) => void;
  onClear: (columnKey: string) => void;
}

export function FilterableTableHead({ title, columnKey, values, selected, onToggle, onSetFilter, onClear }: FilterableTableHeadProps) {
  return (
    <ColumnFilter
      title={title}
      columnKey={columnKey}
      values={values}
      selected={selected}
      onToggle={onToggle}
      onSetFilter={onSetFilter}
      onClear={onClear}
    />
  );
}
