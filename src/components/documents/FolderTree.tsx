import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface FolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  children: FolderNode[];
}

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: { id: string; name: string }) => void;
}

function buildTree(folders: any[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));
  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "bg"));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

const FolderTreeItem = ({
  node,
  depth,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  canModify,
}: {
  node: FolderNode;
  depth: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: { id: string; name: string }) => void;
  canModify: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children.length > 0;
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    const { error } = await supabase.from("document_folders").delete().eq("id", node.id);
    if (error) {
      toast.error("Не може да се изтрие папка с подпапки или документи.");
    } else {
      toast.success("Папката е изтрита.");
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      if (isSelected) onSelectFolder(null);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          isSelected ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <button
          className="p-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
        </button>
        {isSelected ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
        <span className="truncate flex-1">{node.name}</span>
        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onCreateFolder(node.id)}>
                <Plus className="mr-2 h-3.5 w-3.5" />Подпапка
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRenameFolder({ id: node.id, name: node.name })}>
                <Pencil className="mr-2 h-3.5 w-3.5" />Преименувай
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />Изтрий
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {expanded &&
        node.children.map((child) => (
          <FolderTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            canModify={canModify}
          />
        ))}
    </div>
  );
};

const FolderTree = ({ selectedFolderId, onSelectFolder, onCreateFolder, onRenameFolder }: FolderTreeProps) => {
  const { isViewer } = useUserRole();
  const canModify = !isViewer;

  const { data: folders = [] } = useQuery({
    queryKey: ["document-folders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_folders").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const tree = buildTree(folders);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Папки</span>
        {canModify && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCreateFolder(null)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          selectedFolderId === null ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4" />
        <span>Всички документи</span>
      </div>

      {tree.map((node) => (
        <FolderTreeItem
          key={node.id}
          node={node}
          depth={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          canModify={canModify}
        />
      ))}
    </div>
  );
};

export default FolderTree;
