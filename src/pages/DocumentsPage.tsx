import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Image, File, FolderOpen, Upload } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import FolderTree from "@/components/documents/FolderTree";
import FolderFormDialog from "@/components/documents/FolderFormDialog";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import DocumentPreviewDialog from "@/components/documents/DocumentPreviewDialog";
import EmptyState from "@/components/EmptyState";

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

const DocumentsPage = () => {
  const { isViewer } = useUserRole();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderParentId, setFolderParentId] = useState<string | null>(null);
  const [editFolder, setEditFolder] = useState<{ id: string; name: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, profiles:created_by(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get folder breadcrumb path
  const { data: folders = [] } = useQuery({
    queryKey: ["document-folders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_folders").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const folderPath = useMemo(() => {
    if (!selectedFolderId) return [];
    const path: string[] = [];
    let current = selectedFolderId;
    const map = new Map(folders.map((f) => [f.id, f]));
    while (current) {
      const folder = map.get(current);
      if (!folder) break;
      path.unshift(folder.name);
      current = folder.parent_id;
    }
    return path;
  }, [selectedFolderId, folders]);

  const filtered = useMemo(() => {
    return documents.filter((doc: any) => {
      // Folder filter
      if (selectedFolderId !== null) {
        if (doc.folder_id !== selectedFolderId) return false;
      }
      // Search filter
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, selectedFolderId, search]);

  const handleCreateFolder = (parentId: string | null) => {
    setFolderParentId(parentId);
    setEditFolder(null);
    setFolderDialogOpen(true);
  };

  const handleRenameFolder = (folder: { id: string; name: string }) => {
    setEditFolder(folder);
    setFolderParentId(null);
    setFolderDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Документи"
        description="Хранилище за документи, процеси и SOP"
        sopKey="documents"
        actions={
          !isViewer ? (
            <Button className="gradient-primary shadow-md shadow-primary/20" onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Качване
            </Button>
          ) : undefined
        }
      />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Folder sidebar */}
        <div className="w-60 shrink-0 border-r border-border p-3 overflow-y-auto">
          <FolderTree
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* Breadcrumb */}
          {folderPath.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors" onClick={() => setSelectedFolderId(null)}>Документи</button>
              {folderPath.map((name, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span>/</span>
                  <span className={i === folderPath.length - 1 ? "text-foreground font-medium" : ""}>{name}</span>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Documents table */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Няма документи"
              description={selectedFolderId ? "Тази папка е празна." : "Качете документи и ги организирайте по папки."}
            />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Версия</TableHead>
                    <TableHead>Качен от</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc: any) => {
                    const IconComp = getFileIcon(doc.mime_type);
                    return (
                      <TableRow key={doc.id} className="cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{doc.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">v{doc.version}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(doc as any).profiles?.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(doc.created_at), "dd.MM.yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <FolderFormDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        parentId={folderParentId}
        editFolder={editFolder}
      />
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folderId={selectedFolderId}
      />
      <DocumentPreviewDialog
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={(v) => { if (!v) setPreviewDoc(null); }}
      />
    </div>
  );
};

export default DocumentsPage;
