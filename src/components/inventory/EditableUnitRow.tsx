import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil, User } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const unitTypeLabels: Record<string, string> = {
  apartment: "Апартамент",
  office: "Офис",
  parking_inside: "Паркомясто (вътр.)",
  parking_outside: "Паркомясто (външ.)",
  garage: "Гараж",
};

const unitTypeKeys = Object.keys(unitTypeLabels);

const statusColors: Record<string, string> = {
  "Свободен": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "Запазен": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  "Депозит": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  "Предварителен договор": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "Продаден НА": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const allStatusOptions = ["Свободен", "Запазен", "Депозит", "Предварителен договор", "Продаден НА"];

interface EditableUnitRowProps {
  unit: any;
  canEdit: boolean;
  contactName: string | null;
}

export default function EditableUnitRow({ unit, canEdit, contactName }: EditableUnitRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    unit_number: unit.unit_number,
    type: unit.type,
    floor: unit.floor ?? "",
    rooms: unit.rooms ?? "",
    area_sqm: unit.area_sqm ?? "",
    price: unit.price ?? "",
    status: unit.status,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: typeof draft) => {
      const { error } = await supabase
        .from("units")
        .update({
          unit_number: values.unit_number,
          type: values.type as any,
          floor: values.floor === "" ? null : Number(values.floor),
          rooms: values.rooms === "" ? null : Number(values.rooms),
          area_sqm: values.area_sqm === "" ? null : Number(values.area_sqm),
          price: values.price === "" ? null : Number(values.price),
          status: values.status,
        })
        .eq("id", unit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Единицата е обновена");
      setEditing(false);
    },
    onError: () => {
      toast.error("Грешка при запис");
    },
  });

  const handleSave = () => {
    if (!draft.unit_number.trim()) {
      toast.error("Номерът е задължителен");
      return;
    }
    mutation.mutate(draft);
  };

  const handleCancel = () => {
    setDraft({
      unit_number: unit.unit_number,
      type: unit.type,
      floor: unit.floor ?? "",
      rooms: unit.rooms ?? "",
      area_sqm: unit.area_sqm ?? "",
      price: unit.price ?? "",
      status: unit.status,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell>
          <Input
            value={draft.unit_number}
            onChange={(e) => setDraft({ ...draft, unit_number: e.target.value })}
            className="h-8 w-20"
          />
        </TableCell>
        <TableCell>
          <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v })}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitTypeKeys.map((k) => (
                <SelectItem key={k} value={k}>{unitTypeLabels[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={draft.floor}
            onChange={(e) => setDraft({ ...draft, floor: e.target.value })}
            className="h-8 w-16"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={draft.rooms}
            onChange={(e) => setDraft({ ...draft, rooms: e.target.value })}
            className="h-8 w-16"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={draft.area_sqm}
            onChange={(e) => setDraft({ ...draft, area_sqm: e.target.value })}
            className="h-8 w-24"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="h-8 w-28"
          />
        </TableCell>
        <TableCell>
          <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allStatusOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={mutation.isPending}>
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel} disabled={mutation.isPending}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className={canEdit ? "group cursor-pointer hover:bg-muted/40" : ""}
      onDoubleClick={() => canEdit && setEditing(true)}
    >
      <TableCell className="font-medium">{unit.unit_number}</TableCell>
      <TableCell>{unitTypeLabels[unit.type] || unit.type}</TableCell>
      <TableCell>{unit.floor ?? "—"}</TableCell>
      <TableCell>{unit.rooms ?? "—"}</TableCell>
      <TableCell>{unit.area_sqm ? Number(unit.area_sqm).toFixed(2) : "—"}</TableCell>
      <TableCell>
        {unit.price != null ? Number(unit.price).toLocaleString("bg-BG") : "—"}
      </TableCell>
      <TableCell>
        <Badge className={statusColors[unit.status] || "bg-muted text-muted-foreground"}>
          {unit.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between">
          {contactName ? (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{contactName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {canEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
