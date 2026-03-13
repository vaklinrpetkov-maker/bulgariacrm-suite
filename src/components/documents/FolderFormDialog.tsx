import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  editFolder?: { id: string; name: string } | null;
}

const FolderFormDialog = ({ open, onOpenChange, parentId, editFolder }: FolderFormDialogProps) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setName(editFolder?.name || "");
  }, [open, editFolder]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editFolder) {
        const { error } = await supabase.from("document_folders").update({ name: name.trim() }).eq("id", editFolder.id);
        if (error) throw error;
        toast.success("Папката е преименувана.");
      } else {
        const { error } = await supabase.from("document_folders").insert({
          name: name.trim(),
          parent_id: parentId,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("Папката е създадена.");
      }
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editFolder ? "Преименуване на папка" : "Нова папка"}</DialogTitle>
          <DialogDescription>
            {editFolder ? "Въведете ново име за папката." : "Въведете име за новата папка."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="folder-name">Име</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Име на папка..."
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Запазване..." : editFolder ? "Запази" : "Създай"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderFormDialog;
