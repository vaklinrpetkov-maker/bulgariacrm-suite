import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HardDrive, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const GoogleDriveTab = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem("gdrive_last_sync")
  );
  const [lastResult, setLastResult] = useState<{ filesUploaded?: number; error?: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setProgress(10);
    setLastResult(null);

    try {
      setProgress(30);
      const { data, error } = await supabase.functions.invoke("sync-google-drive");
      setProgress(90);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const syncTime = new Date().toLocaleString("bg-BG");
      setLastSync(syncTime);
      localStorage.setItem("gdrive_last_sync", syncTime);
      setLastResult({ filesUploaded: data.filesUploaded });
      setProgress(100);
      toast.success(`Синхронизацията завърши: ${data.filesUploaded} файла качени`);
    } catch (err: any) {
      console.error("Google Drive sync failed:", err);
      setLastResult({ error: err.message || "Неизвестна грешка" });
      toast.error("Грешка при синхронизация с Google Drive");
    } finally {
      setSyncing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Google Drive бекъп
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Синхронизирайте всички документи и CRM данни (контакти, лийдове, сделки,
            договори, срещи, задачи) към Google Drive. Данните се записват в папка
            "VM Invest CRM Backup".
          </p>

          {syncing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Синхронизация...</p>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхронизиране..." : "Синхронизирай сега"}
          </Button>

          {lastResult && !lastResult.error && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Качени файлове: {lastResult.filesUploaded}
            </div>
          )}

          {lastResult?.error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {lastResult.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Папка:</span>
              <span className="font-medium text-foreground">VM Invest CRM Backup</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Подпапки:</span>
              <span className="font-medium text-foreground">Documents, CRM Exports</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Формат:</span>
              <span className="font-medium text-foreground">CSV</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Последна синхронизация:</span>
              <span className="font-medium text-foreground">
                {lastSync || "Няма"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Само администратори могат да стартират синхронизация. Приложението достъпва
            единствено създадените от него папки в Google Drive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleDriveTab;
