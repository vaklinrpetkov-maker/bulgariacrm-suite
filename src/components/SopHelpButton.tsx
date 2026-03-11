import { useState, useEffect } from "react";
import { HelpCircle, Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import sopContent, { type SopSection } from "@/data/sopContent";

interface SopHelpButtonProps {
  sopKey: string;
}

const SopHelpButton = ({ sopKey }: SopHelpButtonProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSections, setEditSections] = useState<SopSection[]>([]);
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  const defaultDoc = sopContent[sopKey];

  // Fetch from DB
  const { data: dbDoc } = useQuery({
    queryKey: ["sop-document", sopKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sop_documents")
        .select("*")
        .eq("module_key", sopKey)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; module_key: string; title: string; sections: SopSection[] } | null;
    },
    enabled: open,
  });

  // Use DB content if available, otherwise fall back to hardcoded
  const doc = dbDoc
    ? { title: dbDoc.title, sections: dbDoc.sections }
    : defaultDoc;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        module_key: sopKey,
        title: editTitle,
        sections: editSections,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (dbDoc) {
        const { error } = await (supabase as any)
          .from("sop_documents")
          .update(payload)
          .eq("id", dbDoc.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("sop_documents")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-document", sopKey] });
      setEditing(false);
      toast.success("SOP документът е запазен");
    },
    onError: () => {
      toast.error("Грешка при запазване на SOP документа");
    },
  });

  const startEditing = () => {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditSections([...doc.sections]);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const updateSection = (index: number, field: keyof SopSection, value: string) => {
    setEditSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSection = () => {
    setEditSections((prev) => [...prev, { heading: "", content: "" }]);
  };

  const removeSection = (index: number) => {
    setEditSections((prev) => prev.filter((_, i) => i !== index));
  };

  if (!doc && !editing) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Стандартна оперативна процедура</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(false); } setOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg">{editing ? "Редактиране на SOP" : doc?.title}</DialogTitle>
            {isAdmin && !editing && (
              <Button variant="ghost" size="sm" onClick={startEditing} className="ml-auto">
                <Pencil className="h-4 w-4 mr-1" />
                Редактирай
              </Button>
            )}
          </DialogHeader>

          <ScrollArea className="px-6 pb-6" style={{ maxHeight: "calc(85vh - 80px)" }}>
            {editing ? (
              <div className="space-y-4 pr-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Заглавие</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {editSections.map((section, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.heading}
                        onChange={(e) => updateSection(i, "heading", e.target.value)}
                        placeholder="Заглавие на секция"
                        className="flex-1 font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeSection(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateSection(i, "content", e.target.value)}
                      placeholder="Съдържание (поддържа **bold** маркиране)"
                      className="min-h-[120px] text-sm font-mono"
                    />
                  </div>
                ))}

                <Button variant="outline" onClick={addSection} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Добави секция
                </Button>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Отказ
                  </Button>
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {saveMutation.isPending ? "Запазване..." : "Запази"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 pr-4">
                {doc?.sections.map((section, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">
                      {section.heading}
                    </h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                        j % 2 === 1 ? (
                          <strong key={j} className="text-foreground font-medium">
                            {part}
                          </strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SopHelpButton;
