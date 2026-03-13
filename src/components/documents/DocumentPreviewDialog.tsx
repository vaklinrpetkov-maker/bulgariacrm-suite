import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Download, FileText, Image, File, Upload, History, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import DocumentVersionHistory from "./DocumentVersionHistory";

interface DocumentPreviewDialogProps {
  document: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

const DocumentPreviewDialog = ({ document: doc, open, onOpenChange }: DocumentPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const { isViewer, isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && doc?.file_path) {
      loadPreview(doc.file_path);
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [open, doc?.file_path]);

  const loadPreview = async (filePath: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;
      setPreviewUrl(URL.createObjectURL(data));
    } catch {
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!doc?.file_path) return;
    try {
      const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.title || "document";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(`Грешка при изтегляне: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    try {
      if (doc.file_path) {
        await supabase.storage.from("documents").remove([doc.file_path]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
      toast.success("Документът е изтрит.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    }
  };

  if (!doc) return null;

  const mimeType = doc.mime_type || "";
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const IconComponent = getFileIcon(mimeType);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPreviewUrl(null); setShowVersions(false); } onOpenChange(v); }}>
      <DialogContent className={isPdf || isImage ? "max-w-5xl h-[90vh] flex flex-col" : "max-w-lg"}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <IconComponent className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="truncate">{doc.title}</DialogTitle>
            <Badge variant="outline" className="shrink-0">v{doc.version}</Badge>
          </div>
          <DialogDescription>
            {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), "dd.MM.yyyy HH:mm")}
          </DialogDescription>
        </DialogHeader>

        {/* Preview area */}
        {isPdf && previewUrl && (
          <div className="flex-1 min-h-0">
            <iframe src={previewUrl} className="w-full h-full rounded-lg border border-border" title="Document preview" />
          </div>
        )}
        {isImage && previewUrl && (
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
            <img src={previewUrl} alt={doc.title} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
        {!isPdf && !isImage && (
          <div className="py-8 text-center space-y-2">
            <File className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Преглед не е наличен за този тип файл.</p>
          </div>
        )}

        {doc.description && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{doc.description}</p>
          </>
        )}

        {/* Version history panel */}
        {showVersions && (
          <>
            <Separator />
            <DocumentVersionHistory documentId={doc.id} currentVersion={doc.version} />
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />Изтегли
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)}>
            <History className="mr-2 h-4 w-4" />{showVersions ? "Скрий версии" : "Версии"}
          </Button>
          {!isViewer && isAdmin && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />Изтрий
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
