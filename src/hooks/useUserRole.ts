import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const MODULES = [
  { key: "contacts", label: "Контакти" },
  { key: "leads", label: "Лийдове" },
  { key: "meetings", label: "Срещи" },
  { key: "deals", label: "Сделки" },
  { key: "contracts", label: "Договори" },
  { key: "mail", label: "Поща" },
  { key: "inventory", label: "Имоти" },
  { key: "documents", label: "Документи" },
  { key: "tasks", label: "Задачи" },
  { key: "projects", label: "Проекти" },
  { key: "budgets", label: "Бюджети" },
  { key: "commissions", label: "Комисионни" },
  { key: "workflows", label: "Работни потоци" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [] } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data || []).map((r) => r.role as string);
    },
    enabled: !!user,
  });

  const isViewer = roles.includes("viewer");

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ["viewer-module-access", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      // Use rpc or raw query since types may not include viewer_module_access yet
      const { data } = await (supabase as any)
        .from("viewer_module_access")
        .select("module")
        .eq("user_id", user.id);
      return (data || []).map((r: any) => r.module as string);
    },
    enabled: !!user && isViewer,
  });

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  const hasModuleAccess = (module: string) => {
    if (!isViewer) return true;
    return moduleAccess.includes(module);
  };

  return { roles, isViewer, isAdmin, isManager, hasModuleAccess, moduleAccess };
}
