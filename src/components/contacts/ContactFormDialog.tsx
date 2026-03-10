import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

const contactSchema = z.object({
  type: z.enum(["person", "company"]),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  email: z.string().max(255).email("Невалиден имейл").optional().or(z.literal("")).nullable(),
  phone: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  egn: z.string().max(20).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
}).refine(
  (data) => {
    if (data.type === "person") return !!data.first_name?.trim();
    return !!data.company_name?.trim();
  },
  { message: "Името е задължително", path: ["first_name"] }
);

export type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContactFormValues) => void;
  contact?: Tables<"contacts"> | null;
  isLoading?: boolean;
}

export default function ContactFormDialog({ open, onOpenChange, onSubmit, contact, isLoading }: ContactFormDialogProps) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: "person",
      first_name: "",
      last_name: "",
      company_name: "",
      email: "",
      phone: "",
      city: "",
      address: "",
      notes: "",
      birthdate: "",
      egn: "",
      category: "client",
    },
  });

  const contactType = form.watch("type");

  useEffect(() => {
    if (contact) {
      form.reset({
        type: contact.type,
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        company_name: contact.company_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        city: contact.city || "",
        address: contact.address || "",
        notes: contact.notes || "",
        birthdate: (contact as any).birthdate || "",
        egn: (contact as any).egn || "",
        category: (contact as any).category || "client",
      });
    } else {
      form.reset({
        type: "person", first_name: "", last_name: "", company_name: "",
        email: "", phone: "", city: "", address: "", notes: "",
        birthdate: "", egn: "", category: "client",
      });
    }
  }, [contact, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Редактиране на контакт" : "Нов контакт"}</DialogTitle>
          <DialogDescription>
            {contact ? "Редактирайте данните на контакта." : "Попълнете данните за новия контакт."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="person">Физическо лице</SelectItem>
                      <SelectItem value="company">Компания</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "client"}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="client">Клиент</SelectItem>
                      <SelectItem value="internal">Наш човек</SelectItem>
                      <SelectItem value="partner">Партньор</SelectItem>
                      <SelectItem value="other">Друг</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {contactType === "person" ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Име *</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            ) : (
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на компания *</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Имейл</FormLabel>
                  <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="birthdate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата на раждане</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="egn" render={({ field }) => (
                <FormItem>
                  <FormLabel>ЕГН</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="напр. 8501178725" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Град</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Бележки</FormLabel>
                <FormControl><Textarea rows={3} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Запазване..." : contact ? "Запази" : "Създай"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
