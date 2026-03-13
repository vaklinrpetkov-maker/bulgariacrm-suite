import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

const DocumentUploadDialog = ({ open, onOpenChange, folderId }: DocumentUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
  };

  const handleFileSelect = (f: File) => {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [title]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const uuid = crypto.randomUUID();
      const sanitized = sanitizeFileName(file.name);
      const folderPath = folderId || "root";
      const storagePath = `${user.id}/${folderPath}/${uuid}_${sanitized}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        title: title.trim() || file.name,
        description: description.trim() || null,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        folder_id: folderId,
        created_by: user.id,
        version: 1,
      });
      if (dbError) throw dbError;

      toast.success("Документът е качен успешно.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Качване на документ</DialogTitle>
          <DialogDescription>Изберете файл или го плъзнете в зоната по-долу.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              file && "border-primary/30 bg-primary/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Плъзнете файл тук или кликнете</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel, изображения и др.</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="doc-title">Заглавие</Label>
            <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заглавие на документа..." />
          </div>

          <div>
            <Label htmlFor="doc-desc">Описание (незадължително)</Label>
            <Textarea id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Кратко описание..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Отказ</Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? "Качване..." : "Качи"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
