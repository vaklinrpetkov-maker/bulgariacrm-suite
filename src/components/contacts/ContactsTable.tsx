import { format } from "date-fns";
import { Pencil, Trash2, Building2, User, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface ContactsTableProps {
  contacts: (Tables<"contacts"> & { _ownerName?: string | null })[];
  onEdit: (contact: Tables<"contacts">) => void;
  onDelete: (contact: Tables<"contacts">) => void;
  onDoubleClick?: (contact: Tables<"contacts">) => void;
  onCreateLead?: (contact: Tables<"contacts">) => void;
}

function getContactName(c: Tables<"contacts">) {
  if (c.type === "company") return c.company_name || "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

export default function ContactsTable({ contacts, onEdit, onDelete, onDoubleClick, onCreateLead }: ContactsTableProps) {
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
            <TableHead>Тип</TableHead>
            <TableHead>Име</TableHead>
            <TableHead>Имейл</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead>Град</TableHead>
            <TableHead>Отговорник</TableHead>
            <TableHead>Създаден</TableHead>
            <TableHead className="w-32">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="cursor-pointer" onDoubleClick={() => onDoubleClick?.(contact)}>
              <TableCell>
                <Badge variant={contact.type === "company" ? "default" : "secondary"} className="gap-1">
                  {contact.type === "company" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {contact.type === "company" ? "Компания" : "Лице"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{getContactName(contact)}</TableCell>
              <TableCell>{contact.email || "—"}</TableCell>
              <TableCell>{contact.phone || "—"}</TableCell>
              <TableCell>{contact.city || "—"}</TableCell>
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
                  <Button variant="ghost" size="icon" onClick={() => onDelete(contact)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
