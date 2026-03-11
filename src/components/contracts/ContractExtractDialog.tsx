import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, X, Loader2, Save, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface ContractProperty {
  "Дата": string;
  "Продавач": string;
  "Купувач": string;
  "ЕГН": string;
  "Сграда": string;
  "Имот №": string;
  "Етаж": string;
  "Вход": string;
  "Застроена площ": string;
  "Обща площ": string;
  "Продажна цена": string;
  "Първа вноска": string;
  "Втора вноска": string;
  "Трета вноска": string;
  "Четвърта вноска": string;
  "Кредит": string;
  "Адрес": string;
  "e-mail": string;
  "Телефон": string;
}

const FIELD_LABELS: { key: keyof ContractProperty; label: string }[] = [
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

interface ContractExtractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractExtractDialog = ({ open, onOpenChange }: ContractExtractDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [extractedData, setExtractedData] = useState<ContractProperty[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const acceptFile = (file: File) =>
    file.type === "application/pdf" || file.name.endsWith(".docx");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(acceptFile);
    if (files.length) setSelectedFiles(files);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(acceptFile);
    if (files.length) setSelectedFiles(files);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (file.type === "application/pdf") {
          const base64 = (reader.result as string).split(",")[1];
          resolve(`[BASE64_PDF]\n${base64}`);
        } else {
          resolve(reader.result as string);
        }
      };
      reader.onerror = reject;
      if (file.type === "application/pdf") reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
  };

  const handleProcess = async () => {
    if (!selectedFiles.length) return;
    setIsProcessing(true);
    setExtractedData(null);
    setProcessProgress({ current: 0, total: selectedFiles.length });

    const allProperties: ContractProperty[] = [];
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setProcessProgress({ current: i + 1, total: selectedFiles.length });

      try {
        const fileContent = await readFileAsText(file);

        // Upload to storage with sanitized filename (ASCII only)
        const fileExt = file.name.split('.').pop() || 'pdf';
        const filePath = `${crypto.randomUUID()}/contract.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(filePath, file);
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else if (i === 0) {
          setUploadedFilePath(filePath);
        }

        const { data, error } = await supabase.functions.invoke("extract-contract", {
          body: { fileContent, fileName: file.name, filePath: uploadError ? null : filePath, userId: user?.id },
        });

        if (error) throw new Error(error.message || "Extraction failed");
        if (data?.error) throw new Error(data.error);

        const properties = Array.isArray(data.data) ? data.data : [data.data];
        allProperties.push(...properties);
        successCount++;
      } catch (err: any) {
        console.error(`Extraction error for ${file.name}:`, err);
        toast.error(`Грешка при обработка на ${file.name}: ${err.message}`);
      }
    }

    if (allProperties.length > 0) {
      setExtractedData(allProperties);
      toast.success(`Обработени ${successCount} файл(а). Намерени ${allProperties.length} имот(а).`);
    } else {
      toast.error("Не можахме да обработим нито един документ.");
    }

    setIsProcessing(false);
  };

  const parseNumeric = (val: string): number | null => {
    if (!val || val === "N/A") return null;
    const cleaned = val.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const handleSaveToContracts = async () => {
    if (!extractedData?.length || !user) return;
    setSaving(true);

    try {
      // Use first property for shared contract-level fields
      const first = extractedData[0];

      // Sum total value across all properties
      const totalValue = extractedData.reduce((sum, p) => {
        const v = parseNumeric(p["Продажна цена"]);
        return v ? sum + v : sum;
      }, 0) || null;

      const propertyList = extractedData.map(p => p["Имот №"] || "N/A").join(", ");
      const title = `Договор - ${first["Купувач"] || "N/A"} - ${propertyList}`;

      // Find or create contact (once, shared across properties)
      let contactId: string | null = null;
      if (first["Купувач"] && first["Купувач"] !== "N/A") {
        const nameParts = first["Купувач"].split(" ");
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(" ") || null;

        if (first["ЕГН"] && first["ЕГН"] !== "N/A") {
          const { data: existing } = await supabase
            .from("contacts")
            .select("id")
            .eq("egn", first["ЕГН"])
            .maybeSingle();
          if (existing) contactId = existing.id;
        }

        if (!contactId) {
          const { data: newContact } = await supabase
            .from("contacts")
            .insert({
              first_name: firstName,
              last_name: lastName,
              egn: first["ЕГН"] !== "N/A" ? first["ЕГН"] : null,
              email: first["e-mail"] !== "N/A" ? first["e-mail"] : null,
              phone: first["Телефон"] !== "N/A" ? first["Телефон"] : null,
              address: first["Адрес"] !== "N/A" ? first["Адрес"] : null,
              type: "person",
              created_by: user.id,
              owner_id: user.id,
            })
            .select("id")
            .single();
          if (newContact) contactId = newContact.id;
        }
      }

      // Create ONE parent contract
      const contractNotes = {
        buyer: first["Купувач"],
        egn: first["ЕГН"],
        seller: first["Продавач"],
        building: first["Сграда"],
        date: first["Дата"],
        credit: first["Кредит"],
        address: first["Адрес"],
        email: first["e-mail"],
        phone: first["Телефон"],
      };

      const storedFilePath = uploadedFilePath;

      const { data: newContract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          title,
          total_value: totalValue,
          status: "draft" as const,
          contact_id: contactId,
          created_by: user.id,
          owner_id: user.id,
          notes: JSON.stringify(contractNotes, null, 2),
          file_path: storedFilePath,
        } as any)
        .select("id")
        .single();

      if (contractError) throw contractError;

      // Create child properties
      const propertyRows = extractedData.map((p) => ({
        contract_id: newContract.id,
        property_type: p["Имот №"]?.split(" ")[0] || null,
        property_number: p["Имот №"] || null,
        floor: p["Етаж"] !== "N/A" ? p["Етаж"] : null,
        entrance: p["Вход"] !== "N/A" ? p["Вход"] : null,
        built_area: p["Застроена площ"] !== "N/A" ? p["Застроена площ"] : null,
        total_area: p["Обща площ"] !== "N/A" ? p["Обща площ"] : null,
        sale_price: p["Продажна цена"] !== "N/A" ? p["Продажна цена"] : null,
        installment_1: p["Първа вноска"] !== "N/A" ? p["Първа вноска"] : null,
        installment_2: p["Втора вноска"] !== "N/A" ? p["Втора вноска"] : null,
        installment_3: p["Трета вноска"] !== "N/A" ? p["Трета вноска"] : null,
        installment_4: p["Четвърта вноска"] !== "N/A" ? p["Четвърта вноска"] : null,
        notes: p,
      }));

      await (supabase as any).from("contract_properties").insert(propertyRows);

      toast.success(`Договор с ${extractedData.length} имот(а) записан успешно!`);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      resetState();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Грешка при записване: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetState = () => {
    setSelectedFiles([]);
    setExtractedData(null);
    setIsProcessing(false);
    setUploadedFilePath(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isProcessing && !saving) { if (!v) resetState(); onOpenChange(v); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Извличане на данни от договор</DialogTitle>
          <DialogDescription>Качете PDF или DOCX файлове с български договори за недвижими имоти</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* File Upload */}
            {!extractedData && !isProcessing && (
              <>
                {selectedFiles.length > 0 ? (
                  <div className="rounded-xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{selectedFiles.length} файл(а) избрани</span>
                      <button onClick={() => setSelectedFiles([])} className="text-xs text-muted-foreground hover:text-destructive">Изчисти</button>
                    </div>
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/40">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/20">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <Button onClick={handleProcess} className="w-full mt-3">
                      <Upload className="mr-2 h-4 w-4" />
                      Обработи с AI
                    </Button>
                  </div>
                ) : (
                  <label
                    className={`relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                      dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-secondary/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input type="file" className="hidden" accept=".pdf,.docx" multiple onChange={handleChange} />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragActive ? "bg-primary/20" : "bg-secondary"}`}>
                        <Upload className={`w-6 h-6 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Пуснете файловете тук</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF или DOCX • Поддържа множество файлове</p>
                      </div>
                    </div>
                  </label>
                )}
              </>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="rounded-xl border border-border p-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Анализиране на договор...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {processProgress.total > 1
                      ? `Файл ${processProgress.current} от ${processProgress.total}`
                      : "AI извлича 19 полета от документа"}
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {extractedData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Извлечени данни</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetState}>Нов файл</Button>
                    <Button size="sm" onClick={handleSaveToContracts} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Запази в договори
                    </Button>
                  </div>
                </div>

                {extractedData.map((property, pIdx) => (
                  <div key={pIdx} className="rounded-xl border border-border overflow-hidden">
                    {extractedData.length > 1 && (
                      <div className="px-4 py-2 bg-primary/10 border-b border-border">
                        <span className="text-sm font-medium text-primary">
                          Имот {pIdx + 1}: {property["Имот №"] || "Неизвестен"}
                        </span>
                      </div>
                    )}
                    <div className="divide-y divide-border">
                      {FIELD_LABELS.map((field) => (
                        <div key={field.key} className="flex items-center px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                          <span className="w-2/5 text-sm text-muted-foreground font-medium">{field.label}</span>
                          <span className="w-3/5 text-sm">{property[field.key] || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContractExtractDialog;
