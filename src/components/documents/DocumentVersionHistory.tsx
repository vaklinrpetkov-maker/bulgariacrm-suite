import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Download, FileText } from "lucide-react";
import { format } from "date-fns";

interface DocumentVersionHistoryProps {
  documentId: string;
  currentVersion: number;
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

const DocumentVersionHistory = ({ documentId, currentVersion }: DocumentVersionHistoryProps) => {
  const { user } = useAuth();
  const { isViewer } = useUserRole();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: versions = [] } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleNewVersion = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const newVersion = currentVersion + 1;
      const uuid = crypto.randomUUID();
      const sanitized = sanitizeFileName(file.name);
      const storagePath = `${user.id}/versions/${documentId}/${uuid}_${sanitized}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { error: versionError } = await supabase.from("document_versions").insert({
        document_id: documentId,
        version: newVersion,
        file_path: storagePath,
        file_size: file.size,
        created_by: user.id,
      });
      if (versionError) throw versionError;

      // Update main document version
      const { error: updateError } = await supabase
        .from("documents")
        .update({ version: newVersion, file_path: storagePath, file_size: file.size, mime_type: file.type })
        .eq("id", documentId);
      if (updateError) throw updateError;

      toast.success(`Версия ${newVersion} е качена.`);
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadVersion = async (filePath: string, version: number) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `v${version}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">История на версиите</h4>
        {!isViewer && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleNewVersion(f); }}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-3.5 w-3.5" />{uploading ? "Качване..." : "Нова версия"}
            </Button>
          </>
        )}
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Няма предишни версии.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {versions.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">v{v.version}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(v.created_at), "dd.MM.yyyy HH:mm")}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadVersion(v.file_path, v.version)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVersionHistory;
