import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsPage = () => {
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
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
