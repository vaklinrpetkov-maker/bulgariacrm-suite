import { useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Building2, User, Plus, Cake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContactAuditHoverCard from "./ContactAuditHoverCard";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useColumnFilters } from "@/hooks/useColumnFilters";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORY_LABELS: Record<string, string> = {
  client: "Клиент",
  internal: "Наш човек",
  partner: "Партньор",
  other: "Друг",
};

interface ContactsTableProps {
  contacts: (Tables<"contacts"> & { _ownerName?: string | null })[];
  onEdit: (contact: Tables<"contacts">) => void;
  onDelete?: (contact: Tables<"contacts">) => void;
  onDoubleClick?: (contact: Tables<"contacts">) => void;
  onCreateLead?: (contact: Tables<"contacts">) => void;
}

function getContactName(c: Tables<"contacts">) {
  if (c.type === "company") return c.company_name || "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

function isBirthdaySoon(birthdate: string | null): boolean {
  if (!birthdate) return false;
  const today = new Date();
  const bd = new Date(birthdate);
  const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  const diff = (thisYearBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

const filterColumns = [
  { key: "type", getValue: (c: any) => c.type === "company" ? "Компания" : "Лице" },
  { key: "category", getValue: (c: any) => CATEGORY_LABELS[c.category || "client"] || "—" },
  { key: "name", getValue: (c: any) => getContactName(c) },
  { key: "email", getValue: (c: any) => c.email || "—" },
  { key: "phone", getValue: (c: any) => c.phone || "—" },
  { key: "birthday", getValue: (c: any) => c.birthdate ? format(new Date(c.birthdate), "dd.MM.yyyy") : "—" },
  { key: "owner", getValue: (c: any) => c._ownerName || "—" },
  { key: "created", getValue: (c: any) => format(new Date(c.created_at), "dd.MM.yyyy") },
];

export default function ContactsTable({ contacts, onEdit, onDelete, onDoubleClick, onCreateLead }: ContactsTableProps) {
  const { filters, uniqueValues, toggleFilter, setColumnFilter, clearFilter, filteredData } =
    useColumnFilters(contacts, filterColumns);

  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Няма намерени контакти.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <ColumnFilter title="Тип" columnKey="type" values={uniqueValues["type"] || []} selected={filters["type"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Категория" columnKey="category" values={uniqueValues["category"] || []} selected={filters["category"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Име" columnKey="name" values={uniqueValues["name"] || []} selected={filters["name"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Имейл" columnKey="email" values={uniqueValues["email"] || []} selected={filters["email"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Телефон" columnKey="phone" values={uniqueValues["phone"] || []} selected={filters["phone"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Рожден ден" columnKey="birthday" values={uniqueValues["birthday"] || []} selected={filters["birthday"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Отговорник" columnKey="owner" values={uniqueValues["owner"] || []} selected={filters["owner"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead>
              <ColumnFilter title="Създаден" columnKey="created" values={uniqueValues["created"] || []} selected={filters["created"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
            </TableHead>
            <TableHead className="w-32">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((contact) => {
            const birthdate = (contact as any).birthdate as string | null;
            const bdSoon = isBirthdaySoon(birthdate);
            return (
              <TableRow key={contact.id} className="cursor-pointer" onDoubleClick={() => onDoubleClick?.(contact)}>
                <TableCell>
                  <Badge variant={contact.type === "company" ? "default" : "secondary"} className="gap-1">
                    {contact.type === "company" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {contact.type === "company" ? "Компания" : "Лице"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[(contact as any).category || "client"] || "—"}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <ContactAuditHoverCard contactId={contact.id}>
                    <span className="cursor-help underline decoration-dotted underline-offset-4 decoration-muted-foreground/40">
                      {getContactName(contact)}
                    </span>
                  </ContactAuditHoverCard>
                </TableCell>
                <TableCell>{contact.email || "—"}</TableCell>
                <TableCell>{contact.phone || "—"}</TableCell>
                <TableCell>
                  {birthdate ? (
                    <span className="flex items-center gap-1">
                      {format(new Date(birthdate), "dd.MM.yyyy")}
                      {bdSoon && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Cake className="h-4 w-4 text-orange-500" />
                          </TooltipTrigger>
                          <TooltipContent>Рожден ден скоро!</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>{(contact as any)._ownerName || "—"}</TableCell>
                <TableCell>{format(new Date(contact.created_at), "dd.MM.yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onCreateLead?.(contact)}>
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Нов лийд</TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(contact)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(contact)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
