import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Users, Target, Calendar, Handshake, FileText,
  FolderOpen, Workflow, CheckSquare, Briefcase, Wallet,
  Percent, Bell, Settings, LogOut, ChevronDown, Home,
  Building, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
    <aside className="flex h-screen w-56 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-widest text-sidebar-accent-foreground">BuildCRM</h1>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-px">
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
                    "flex w-full items-center gap-2.5 px-3 py-1.5 text-xs uppercase tracking-wider transition-colors duration-150",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform duration-150", expanded && "rotate-180")}
                  />
                </button>
                {expanded && (
                  <div className="ml-6 mt-px space-y-px border-l border-sidebar-border pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-1.5 text-xs tracking-wide transition-colors duration-150",
                            isActive
                              ? "text-primary font-medium"
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
                  "flex items-center gap-2.5 px-3 py-1.5 text-xs uppercase tracking-wider transition-colors duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-6 w-6 items-center justify-center bg-sidebar-accent text-[10px] font-medium uppercase text-sidebar-accent-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[10px] tracking-wide text-sidebar-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1 text-sidebar-muted hover:text-sidebar-foreground transition-colors duration-150"
            title="Изход"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
