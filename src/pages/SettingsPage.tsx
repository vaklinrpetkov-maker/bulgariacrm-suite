import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";
import ViewerAccessTab from "@/components/settings/ViewerAccessTab";

const SettingsPage = () => {
  const { user } = useAuth();
  const [signatureHtml, setSignatureHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("email_signatures")
      .select("signature_html")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSignatureHtml(data.signature_html);
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_signatures")
      .upsert(
        { user_id: user.id, signature_html: signatureHtml, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    setSaving(false);
    if (error) {
      toast.error("Грешка при запазване на подписа");
      console.error(error);
    } else {
      toast.success("Подписът е запазен успешно");
    }
  };

  return (
    <div>
      <PageHeader title="Настройки" description="Системни настройки и RBAC" />
      <div className="p-6">
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Роли и права</TabsTrigger>
            <TabsTrigger value="teams">Екипи</TabsTrigger>
            <TabsTrigger value="titles">Длъжности</TabsTrigger>
            <TabsTrigger value="users">Потребители</TabsTrigger>
            <TabsTrigger value="signature">Имейл подпис</TabsTrigger>
          </TabsList>
          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Роли и разрешения</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Администратор, Мениджър, Потребител — конфигурирайте разрешенията за всяка роля.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="teams" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Екипи (отдели)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Управлявайте екипите и членовете им.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="titles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Длъжности</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Дефинирайте длъжности в организацията.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Потребители</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Преглед и управление на потребителите.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signature" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Редактор на подпис</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Въведете HTML за вашия имейл подпис. Той ще се добавя автоматично към всички изходящи имейли.
                  </p>
                  <Textarea
                    value={signatureHtml}
                    onChange={(e) => setSignatureHtml(e.target.value)}
                    placeholder={'<p>С уважение,<br/>Вашето име</p>'}
                    className="min-h-[200px] font-mono text-xs"
                    disabled={!loaded}
                  />
                  <Button onClick={handleSave} disabled={saving || !loaded}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Запазване..." : "Запази подписа"}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Преглед</CardTitle>
                </CardHeader>
                <CardContent>
                  {signatureHtml ? (
                    <div
                      className="rounded-md border border-border p-4 bg-background text-sm"
                      dangerouslySetInnerHTML={{ __html: signatureHtml }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Няма въведен подпис.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
