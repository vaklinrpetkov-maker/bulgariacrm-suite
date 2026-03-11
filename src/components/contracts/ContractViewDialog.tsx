import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  draft: "Чернова", active: "Активен", completed: "Завършен", cancelled: "Анулиран",
};
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", active: "default", completed: "outline", cancelled: "destructive",
};

interface ContractViewDialogProps {
  contract: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

function tryParseNotes(notes: string | null): Record<string, string> | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {}
  return null;
}

const CONTRACT_INFO_LABELS: { key: string; label: string }[] = [
  { key: "buyer", label: "Купувач" },
  { key: "egn", label: "ЕГН" },
  { key: "seller", label: "Продавач" },
  { key: "building", label: "Сграда" },
  { key: "date", label: "Дата на договор" },
  { key: "credit", label: "Кредит" },
  { key: "address", label: "Адрес" },
  { key: "email", label: "e-mail" },
  { key: "phone", label: "Телефон" },
];

const PROPERTY_LABELS: { key: string; label: string }[] = [
  { key: "property_number", label: "Имот №" },
  { key: "floor", label: "Етаж" },
  { key: "entrance", label: "Вход" },
  { key: "built_area", label: "Застроена площ (кв.м.)" },
  { key: "total_area", label: "Обща площ (кв.м.)" },
  { key: "sale_price", label: "Продажна цена" },
  { key: "installment_1", label: "Първа вноска" },
  { key: "installment_2", label: "Втора вноска" },
  { key: "installment_3", label: "Трета вноска" },
  { key: "installment_4", label: "Четвърта вноска" },
];

const ContractViewDialog = ({ contract, open, onOpenChange, onDeleted }: ContractViewDialogProps) => {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ["contract-properties", contract?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contract_properties")
        .select("*")
        .eq("contract_id", contract!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contract?.id && open,
  });

  const handleDelete = async () => {
    if (!contract) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("contracts").delete().eq("id", contract.id);
      if (error) throw error;
      toast.success("Договорът беше изтрит.");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onOpenChange(false);
      onDeleted?.();
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!contract) return null;

  const contactName = contract.contacts
    ? contract.contacts.type === "company"
      ? contract.contacts.company_name
      : [contract.contacts.first_name, contract.contacts.last_name].filter(Boolean).join(" ")
    : null;

  const contractInfo = tryParseNotes(contract.notes);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{contract.title}</DialogTitle>
              <Badge variant={statusVariant[contract.status] || "secondary"}>
                {statusLabels[contract.status] || contract.status}
              </Badge>
            </div>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-6">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Изтриване на договор</AlertDialogTitle>
                    <AlertDialogDescription>
                      Сигурни ли сте, че искате да изтриете „{contract.title}"? Всички свързани имоти също ще бъдат изтрити. Действието е необратимо.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? "Изтриване..." : "Изтрий"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <DialogDescription>
            {contract.contract_number ? `№ ${contract.contract_number} · ` : ""}
            Създаден на {format(new Date(contract.created_at), "dd.MM.yyyy")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Контакт" value={contactName || "—"} />
              <InfoRow label="Обща стойност" value={contract.total_value != null ? `${Number(contract.total_value).toLocaleString("bg-BG")} лв.` : "—"} />
              <InfoRow label="Подписан" value={contract.signed_at ? format(new Date(contract.signed_at), "dd.MM.yyyy") : "—"} />
              <InfoRow label="Номер" value={contract.contract_number || "—"} />
            </div>

            {/* Contract-level extracted info */}
            {contractInfo && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Данни от договор</h3>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {CONTRACT_INFO_LABELS.map((field) => {
                      const val = contractInfo[field.key];
                      if (!val || val === "N/A") return null;
                      return (
                        <div key={field.key} className="flex items-center px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                          <span className="w-2/5 text-sm text-muted-foreground font-medium">{field.label}</span>
                          <span className="w-3/5 text-sm">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Properties */}
            {properties.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    Имоти ({properties.length})
                  </h3>
                  <div className="space-y-3">
                    {properties.map((prop: any, idx: number) => (
                      <div key={prop.id} className="rounded-lg border border-border overflow-hidden">
                        <div className="px-4 py-2 bg-primary/10 border-b border-border">
                          <span className="text-sm font-medium text-primary">
                            {prop.property_number || `Имот ${idx + 1}`}
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {PROPERTY_LABELS.map((field) => {
                            const val = prop[field.key];
                            if (!val) return null;
                            return (
                              <div key={field.key} className="flex items-center px-4 py-2 hover:bg-secondary/30 transition-colors">
                                <span className="w-2/5 text-sm text-muted-foreground font-medium">{field.label}</span>
                                <span className="w-3/5 text-sm">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Plain notes fallback */}
            {!contractInfo && !properties.length && contract.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Бележки</h3>
                  <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default ContractViewDialog;
