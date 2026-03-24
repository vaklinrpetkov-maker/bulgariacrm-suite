import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Mail, Eye, EyeOff, Server } from "lucide-react";
import ViewerAccessTab from "@/components/settings/ViewerAccessTab";
import GoogleDriveTab from "@/components/settings/GoogleDriveTab";

const SettingsPage = () => {
  const { user } = useAuth();
  const [signatureHtml, setSignatureHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Email account state
  const [emailAddress, setEmailAddress] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [hasEmailAccount, setHasEmailAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load signature
    supabase
      .from("email_signatures")
      .select("signature_html")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSignatureHtml(data.signature_html);
        setLoaded(true);
      });

    // Load email account
    supabase
      .from("user_email_accounts")
      .select("email_address, email_password")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEmailAddress(data.email_address);
          setEmailPassword(data.email_password);
          setHasEmailAccount(true);
        }
        setEmailLoaded(true);
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

  const handleEmailSave = async () => {
    if (!user) return;
    if (!emailAddress.endsWith("@vminvest.bg")) {
      toast.error("Имейлът трябва да завършва на @vminvest.bg");
      return;
    }
    if (!emailPassword) {
      toast.error("Моля въведете парола");
      return;
    }
    setEmailSaving(true);
    const { error } = await supabase
      .from("user_email_accounts")
      .upsert(
        {
          user_id: user.id,
          email_address: emailAddress,
          email_password: emailPassword,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    setEmailSaving(false);
    if (error) {
      toast.error("Грешка при запазване на имейл акаунта");
      console.error(error);
    } else {
      setHasEmailAccount(true);
      toast.success("Имейл акаунтът е запазен успешно");
    }
  };

  return (
    <div>
      <PageHeader title="Настройки" description="Системни настройки и RBAC" sopKey="settings" />
      <div className="p-6">
        <Tabs defaultValue="email-account">
          <TabsList className="flex-wrap">
            <TabsTrigger value="email-account">Имейл акаунт</TabsTrigger>
            <TabsTrigger value="signature">Имейл подпис</TabsTrigger>
            <TabsTrigger value="roles">Роли и права</TabsTrigger>
            <TabsTrigger value="teams">Екипи</TabsTrigger>
            <TabsTrigger value="titles">Длъжности</TabsTrigger>
            <TabsTrigger value="users">Потребители</TabsTrigger>
            <TabsTrigger value="viewer-access">Viewer достъп</TabsTrigger>
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
          </TabsList>

          <TabsContent value="email-account" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Имейл акаунт
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Въведете вашия @vminvest.bg имейл и парола. Те ще се използват за изпращане и получаване на имейли.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="email-address">Имейл адрес</Label>
                    <Input
                      id="email-address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="vashe.ime@vminvest.bg"
                      disabled={!emailLoaded}
                    />
                    {emailAddress && !emailAddress.endsWith("@vminvest.bg") && (
                      <p className="text-xs text-destructive">Имейлът трябва да завършва на @vminvest.bg</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-password">Парола</Label>
                    <div className="relative">
                      <Input
                        id="email-password"
                        type={showPassword ? "text" : "password"}
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={!emailLoaded}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleEmailSave}
                    disabled={emailSaving || !emailLoaded || !emailAddress || !emailPassword}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {emailSaving ? "Запазване..." : hasEmailAccount ? "Обнови акаунта" : "Запази акаунта"}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Настройки на сървъра
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Тези настройки са предварително конфигурирани за всички @vminvest.bg акаунти.
                  </p>
                  <div className="rounded-md border border-border p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Входящ сървър:</span>
                      <span className="font-medium text-foreground">mail.vminvest.bg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IMAP порт:</span>
                      <span className="font-medium text-foreground">993 (SSL)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">POP3 порт:</span>
                      <span className="font-medium text-foreground">995 (SSL)</span>
                    </div>
                    <div className="border-t border-border my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Изходящ сървър:</span>
                      <span className="font-medium text-foreground">mail.vminvest.bg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SMTP порт:</span>
                      <span className="font-medium text-foreground">465 (SSL)</span>
                    </div>
                  </div>
                  {hasEmailAccount && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Акаунтът е конфигуриран
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Роли и разрешения</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Администратор, Мениджър, Потребител — конфигурирайте разрешенията за всяка роля.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="teams" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Екипи (отдели)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Управлявайте екипите и членовете им.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="titles" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Длъжности</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Дефинирайте длъжности в организацията.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Потребители</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Преглед и управление на потребителите.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="viewer-access" className="mt-4">
            <ViewerAccessTab />
          </TabsContent>
          <TabsContent value="google-drive" className="mt-4">
            <GoogleDriveTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
