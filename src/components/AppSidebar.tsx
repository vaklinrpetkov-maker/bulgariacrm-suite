import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Building2, Users, Target, Calendar, Handshake, FileText,
  FolderOpen, Workflow, CheckSquare, Briefcase, Wallet,
  Percent, Bell, Settings, LogOut, ChevronDown, Home,
  Building, Sun, Moon, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  module?: string;
  children?: { label: string; path: string; module?: string }[];
}

const navItems: NavItem[] = [
  { label: "Табло", path: "/", icon: Home },
  {
    label: "CRM", path: "/crm", icon: Users,
    children: [
      { label: "Контакти", path: "/crm/contacts", module: "contacts" },
      { label: "Лийдове", path: "/crm/leads", module: "leads" },
      { label: "Срещи", path: "/crm/meetings", module: "meetings" },
      { label: "Сделки", path: "/crm/deals", module: "deals" },
      { label: "Договори", path: "/crm/contracts", module: "contracts" },
    ],
  },
  { label: "Поща", path: "/mail", icon: Mail, module: "mail" },
  { label: "Имоти", path: "/inventory", icon: Building, module: "inventory" },
  { label: "Документи", path: "/documents", icon: FolderOpen, module: "documents" },
  { label: "Задачи", path: "/tasks", icon: CheckSquare, module: "tasks" },
  { label: "Проекти", path: "/projects", icon: Briefcase, module: "projects" },
  { label: "Бюджети", path: "/budgets", icon: Wallet, module: "budgets" },
  { label: "Комисионни", path: "/commissions", icon: Percent, module: "commissions" },
  { label: "Работни потоци", path: "/workflows", icon: Workflow, module: "workflows" },
  { label: "Известия", path: "/notifications", icon: Bell },
  { label: "Настройки", path: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const { isViewer, hasModuleAccess } = useUserRole();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/crm"]);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-emails-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("direction", "inbound")
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="flex h-full w-full flex-col sidebar-gradient border-r border-sidebar-border relative overflow-hidden">
      {/* Subtle glow accent at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-48 bg-sidebar-primary/10 blur-3xl rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border relative z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-md shadow-primary/20">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">BuildCRM</h1>
          <p className="text-[11px] text-sidebar-muted">Строителство & Имоти</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 relative z-10">
        {navItems.filter((item) => {
          if (!item.module) return true;
          return hasModuleAccess(item.module);
        }).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const expanded = expandedItems.includes(item.path);

          if (item.children) {
            return (
              <div key={item.path}>
                <button
                  onClick={() => toggleExpand(item.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-180")}
                  />
                </button>
                {expanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                            isActive
                              ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.path === "/mail" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full gradient-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/25">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3 relative z-10">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all"
            title={isDark ? "Светъл режим" : "Тъмен режим"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all"
            title="Изход"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
