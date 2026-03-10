import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

interface ParsedContact {
  type: "person" | "company";
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  birthdate: string | null;
  egn: string | null;
  category: string | null;
  notes: string | null;
}

function parsePhone(val: any): string | null {
  if (!val) return null;
  let s = String(val).trim();
  // Handle scientific notation numbers
  if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(s)) {
    s = String(Math.round(Number(s)));
  }
  if (!s) return null;
  // Add leading zero if missing
  if (s[0] !== '0' && s[0] !== '+') s = '0' + s;
  return s;
}

function parseName(name: string): { first_name: string | null; last_name: string | null; company_name: string | null; type: "person" | "company" } {
  if (!name) return { first_name: null, last_name: null, company_name: null, type: "person" };

  // Detect company names (contains ЕООД, ООД, АД, etc.)
  const companyPatterns = /\b(ЕООД|ООД|АД|ЕАД|ЕТ|СД|КД|КДА)\b/i;
  if (companyPatterns.test(name)) {
    return { first_name: null, last_name: null, company_name: name.trim(), type: "company" };
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: null, company_name: null, type: "person" };
  }
  // First word = first name, rest = last name (handles middle names)
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
    company_name: null,
    type: "person",
  };
}

function parseCategoryFromType(val: string | null): string {
  if (!val) return "client";
  const lower = val.toLowerCase().trim();
  if (lower.includes("наш") || lower.includes("intern")) return "internal";
  if (lower.includes("партн") || lower.includes("partner")) return "partner";
  return "client";
}

function parseBirthdate(val: any): string | null {
  if (!val) return null;
  // If it's a JS Date (from XLSX)
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try DD.MM.YYYY
  const match = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

function parseExcelRows(rows: any[]): ParsedContact[] {
  return rows.filter(r => {
    const name = r["Name"] || r["Име"] || r["name"] || "";
    return name.trim() && name.trim() !== "New contact";
  }).map(r => {
    const rawName = String(r["Name"] || r["Име"] || r["name"] || "").trim();
    const { first_name, last_name, company_name, type } = parseName(rawName);
    const rawType = r["Type"] || r["Тип"] || "";
    const category = parseCategoryFromType(rawType);

    return {
      type,
      first_name,
      last_name,
      company_name,
      email: r["Email"] || r["Имейл"] || r["email"] || null,
      phone: parsePhone(r["Phone number"] || r["Телефон"] || r["phone"]),
      city: null,
      address: r["Адрес по л.к."] || r["Адрес"] || r["address"] || null,
      birthdate: parseBirthdate(r["Birthdate as per Personal ID"] || r["Рожден ден"] || r["birthdate"]),
      egn: r["ЕГН"] || r["egn"] || null,
      category,
      notes: r["Имоти"] ? `Имоти: ${r["Имоти"]}` : null,
    };
  });
}

export default function ContactImportDialog({ open, onOpenChange, onImported }: ContactImportDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      setParsed(parseExcelRows(rows));
    };
    reader.readAsArrayBuffer(file);
  };

  const importMutation = useMutation({
    mutationFn: async (contacts: ParsedContact[]) => {
      const toInsert = contacts.map(c => ({
        ...c,
        owner_id: user!.id,
        created_by: user!.id,
      }));
      // Insert in batches of 50
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error } = await supabase.from("contacts").insert(batch as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `Успешно импортирани ${parsed.length} контакта.` });
      onImported();
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Грешка при импорт.", description: err?.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setParsed([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Импорт на контакти от Excel</DialogTitle>
          <DialogDescription>
            Изберете Excel файл (.xlsx) с контакти. Поддържани колони: Name, Email, Phone number, Type, ЕГН, Адрес по л.к., Birthdate as per Personal ID, Имоти.
          </DialogDescription>
        </DialogHeader>

        {parsed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Изберете файл за импорт</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />Избери файл
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Намерени <strong>{parsed.length}</strong> контакта в <strong>{fileName}</strong>. Прегледайте и натиснете „Импортирай".
              </AlertDescription>
            </Alert>
            <ScrollArea className="flex-1 max-h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Име</TableHead>
                    <TableHead>Имейл</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Рожден ден</TableHead>
                    <TableHead>ЕГН</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{c.type === "company" ? "Компания" : "Лице"}</TableCell>
                      <TableCell className="text-xs">
                        {{ client: "Клиент", internal: "Наш човек", partner: "Партньор", other: "Друг" }[c.category || "client"]}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {c.type === "company" ? c.company_name : [c.first_name, c.last_name].filter(Boolean).join(" ")}
                      </TableCell>
                      <TableCell className="text-xs">{c.email || "—"}</TableCell>
                      <TableCell className="text-xs">{c.phone || "—"}</TableCell>
                      <TableCell className="text-xs">{c.birthdate || "—"}</TableCell>
                      <TableCell className="text-xs">{c.egn || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Отказ</Button>
          {parsed.length > 0 && (
            <>
              <Button variant="outline" onClick={() => { setParsed([]); setFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                Нов файл
              </Button>
              <Button onClick={() => importMutation.mutate(parsed)} disabled={importMutation.isPending}>
                {importMutation.isPending ? "Импортиране..." : `Импортирай ${parsed.length} контакта`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
