import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Users, Target, Calendar, Handshake, FileText,
  FolderOpen, Workflow, CheckSquare, Briefcase, Wallet,
  Percent, Bell, Settings, LogOut, ChevronDown, Home,
  Building, LayoutGrid, Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "Табло", path: "/", icon: Home },
  {
    label: "CRM", path: "/crm", icon: Users,
    children: [
      { label: "Контакти", path: "/crm/contacts" },
      { label: "Лийдове", path: "/crm/leads" },
      { label: "Срещи", path: "/crm/meetings" },
      { label: "Сделки", path: "/crm/deals" },
      { label: "Договори", path: "/crm/contracts" },
    ],
  },
  { label: "Имоти", path: "/inventory", icon: Building },
  { label: "Документи", path: "/documents", icon: FolderOpen },
  { label: "Задачи", path: "/tasks", icon: CheckSquare },
  { label: "Проекти", path: "/projects", icon: Briefcase },
  { label: "Бюджети", path: "/budgets", icon: Wallet },
  { label: "Комисионни", path: "/commissions", icon: Percent },
  { label: "Работни потоци", path: "/workflows", icon: Workflow },
  { label: "Известия", path: "/notifications", icon: Bell },
  { label: "Настройки", path: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/crm"]);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

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
    <aside className="flex h-full w-full flex-col sidebar-gradient border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground">BuildCRM</h1>
          <p className="text-xs text-sidebar-muted">Строителство & Имоти</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const expanded = expandedItems.includes(item.path);

          if (item.children) {
            return (
              <div key={item.path}>
                <button
                  onClick={() => toggleExpand(item.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                  />
                </button>
                {expanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                              : "text-sidebar-muted hover:text-sidebar-foreground"
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="rounded p-1 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            title={isDark ? "Светъл режим" : "Тъмен режим"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={signOut}
            className="rounded p-1 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
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
