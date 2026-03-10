import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MODULES } from "@/hooks/useUserRole";
import { Shield, Save } from "lucide-react";

interface ViewerUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  modules: string[];
}

const ViewerAccessTab = () => {
  const queryClient = useQueryClient();
  const [changes, setChanges] = useState<Record<string, string[]>>({});

  // Get all viewer users
  const { data: viewers = [], isLoading } = useQuery({
    queryKey: ["viewer-users"],
    queryFn: async () => {
      // Get users with viewer role
      const { data: viewerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "viewer" as any);

      if (!viewerRoles?.length) return [];

      const userIds = viewerRoles.map((r) => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Get existing access
      const { data: access } = await supabase
        .from("viewer_module_access")
        .select("user_id, module")
        .in("user_id", userIds);

      const accessMap: Record<string, string[]> = {};
      (access || []).forEach((a) => {
        if (!accessMap[a.user_id]) accessMap[a.user_id] = [];
        accessMap[a.user_id].push(a.module);
      });

      return (profiles || []).map((p) => ({
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        modules: accessMap[p.user_id] || [],
      })) as ViewerUser[];
    },
  });

  const getModules = (userId: string, original: string[]) => {
    return changes[userId] ?? original;
  };

  const toggleModule = (userId: string, module: string, original: string[]) => {
    const current = getModules(userId, original);
    const updated = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    setChanges((prev) => ({ ...prev, [userId]: updated }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ userId, modules }: { userId: string; modules: string[] }) => {
      // Delete existing
      await supabase
        .from("viewer_module_access")
        .delete()
        .eq("user_id", userId);

      // Insert new
      if (modules.length > 0) {
        const rows = modules.map((module) => ({
          user_id: userId,
          module,
        }));
        const { error } = await supabase
          .from("viewer_module_access")
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewer-users"] });
      toast.success("Достъпът е обновен успешно");
    },
    onError: () => {
      toast.error("Грешка при обновяване на достъпа");
    },
  });

  const handleSave = (userId: string, original: string[]) => {
    const modules = getModules(userId, original);
    saveMutation.mutate({ userId, modules });
    setChanges((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Зареждане...</p>;
  }

  if (viewers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Няма регистрирани потребители с роля „Viewer".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {viewers.map((viewer) => {
        const currentModules = getModules(viewer.user_id, viewer.modules);
        const hasChanges = changes[viewer.user_id] !== undefined;

        return (
          <Card key={viewer.user_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {viewer.full_name || viewer.email}
                  </CardTitle>
                  {viewer.full_name && (
                    <p className="text-xs text-muted-foreground">{viewer.email}</p>
                  )}
                </div>
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(viewer.user_id, viewer.modules)}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Запази
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {MODULES.map((mod) => (
                  <label
                    key={mod.key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={currentModules.includes(mod.key)}
                      onCheckedChange={() =>
                        toggleModule(viewer.user_id, mod.key, viewer.modules)
                      }
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ViewerAccessTab;
