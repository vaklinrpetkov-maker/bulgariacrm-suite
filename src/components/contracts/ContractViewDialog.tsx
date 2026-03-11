import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
}

const EXTRACTED_LABELS: { key: string; label: string }[] = [
  { key: "Дата", label: "Дата" },
  { key: "Продавач", label: "Продавач" },
  { key: "Купувач", label: "Купувач" },
  { key: "ЕГН", label: "ЕГН" },
  { key: "Сграда", label: "Сграда" },
  { key: "Имот №", label: "Имот №" },
  { key: "Етаж", label: "Етаж" },
  { key: "Вход", label: "Вход" },
  { key: "Застроена площ", label: "Застроена площ (кв.м.)" },
  { key: "Обща площ", label: "Обща площ (кв.м.)" },
  { key: "Продажна цена", label: "Продажна цена" },
  { key: "Първа вноска", label: "Първа вноска" },
  { key: "Втора вноска", label: "Втора вноска" },
  { key: "Трета вноска", label: "Трета вноска" },
  { key: "Четвърта вноска", label: "Четвърта вноска" },
  { key: "Кредит", label: "Кредит" },
  { key: "Адрес", label: "Адрес" },
  { key: "e-mail", label: "e-mail" },
  { key: "Телефон", label: "Телефон" },
];

function tryParseExtracted(notes: string | null): Record<string, string> | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed["Купувач"]) return parsed;
  } catch {}
  return null;
}

const ContractViewDialog = ({ contract, open, onOpenChange }: ContractViewDialogProps) => {
  if (!contract) return null;

  const contactName = contract.contacts
    ? contract.contacts.type === "company"
      ? contract.contacts.company_name
      : [contract.contacts.first_name, contract.contacts.last_name].filter(Boolean).join(" ")
    : null;

  const extracted = tryParseExtracted(contract.notes);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">{contract.title}</DialogTitle>
            <Badge variant={statusVariant[contract.status] || "secondary"}>
              {statusLabels[contract.status] || contract.status}
            </Badge>
          </div>
          <DialogDescription>
            {contract.contract_number ? `№ ${contract.contract_number} · ` : ""}
            Създаден на {format(new Date(contract.created_at), "dd.MM.yyyy")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Контакт" value={contactName || "—"} />
              <InfoRow label="Стойност" value={contract.total_value != null ? `${Number(contract.total_value).toLocaleString("bg-BG")} лв.` : "—"} />
              <InfoRow label="Подписан" value={contract.signed_at ? format(new Date(contract.signed_at), "dd.MM.yyyy") : "—"} />
              <InfoRow label="Номер" value={contract.contract_number || "—"} />
            </div>

            {/* AI-extracted fields */}
            {extracted && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Извлечени данни от AI</h3>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {EXTRACTED_LABELS.map((field) => {
                      const val = extracted[field.key];
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

            {/* Plain notes fallback */}
            {!extracted && contract.notes && (
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
