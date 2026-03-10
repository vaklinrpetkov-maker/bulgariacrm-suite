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
      if (!user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data || []).map((r) => r.role);
    },
    enabled: !!user,
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ["viewer-module-access", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("viewer_module_access")
        .select("module")
        .eq("user_id", user.id);
      return (data || []).map((r) => r.module);
    },
    enabled: !!user && roles.includes("viewer"),
  });

  const isViewer = roles.includes("viewer");
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  const hasModuleAccess = (module: string) => {
    if (!isViewer) return true;
    return moduleAccess.includes(module);
  };

  return { roles, isViewer, isAdmin, isManager, hasModuleAccess, moduleAccess };
}
