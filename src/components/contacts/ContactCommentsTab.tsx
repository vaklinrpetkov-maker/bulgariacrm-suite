import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

interface ContactCommentsTabProps {
  contactId: string;
}

interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
}

export default function ContactCommentsTab({ contactId }: ContactCommentsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["contact-comments", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_comments")
        .select("id, content, created_at, user_id")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch author names
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

      return data.map((c: any): CommentWithAuthor => ({
        ...c,
        author_name: nameMap.get(c.user_id) ?? "—",
      }));
    },
    enabled: !!contactId,
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("contact_comments").insert({
        contact_id: contactId,
        user_id: user!.id,
        content: text,
      });
      if (error) throw error;
      await supabase.from("audit_trail").insert({
        entity_type: "contact",
        entity_id: contactId,
        action: "updated" as const,
        user_id: user!.id,
        new_data: { comment: text },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-comments", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contact-audit", contactId] });
      setContent("");
    },
    onError: () => toast({ title: "Грешка при добавяне", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Find comment content before deleting
      const comment = comments.find((c) => c.id === id);
      const { error } = await supabase.from("contact_comments").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("audit_trail").insert({
        entity_type: "contact",
        entity_id: contactId,
        action: "updated" as const,
        user_id: user!.id,
        old_data: comment ? { comment: comment.content } : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-comments", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contact-audit", contactId] });
    },
    onError: () => toast({ title: "Грешка при изтриване", variant: "destructive" }),
  });

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Textarea
          placeholder="Напишете коментар..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <Button size="sm" onClick={handleSubmit} disabled={addMutation.isPending || !content.trim()}>
          Добави
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Няма коментари.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-md border border-border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: bg })}
                  </span>
                </div>
                {user?.id === c.user_id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
