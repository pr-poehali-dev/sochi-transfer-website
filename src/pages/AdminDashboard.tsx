import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';
import TariffsManager from '@/components/admin/TariffsManager';
import FleetManager from '@/components/admin/FleetManager';
import OrdersManager from '@/components/admin/OrdersManager';
import StatusesManager from '@/components/admin/StatusesManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    newOrders: 0,
    activeTariffs: 0,
    activeFleet: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const name = localStorage.getItem('admin_name');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    setAdminName(name || 'Администратор');
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [ordersRes, tariffsRes, fleetRes] = await Promise.all([
        fetch(API_URLS.orders),
        fetch(`${API_URLS.tariffs}?active=true`),
        fetch(`${API_URLS.fleet}?active=true`)
      ]);

      const ordersData = await ordersRes.json();
      const tariffsData = await tariffsRes.json();
      const fleetData = await fleetRes.json();

      setStats({
        totalOrders: ordersData.orders?.length || 0,
        newOrders: ordersData.orders?.filter((o: any) => o.status_id === 1).length || 0,
        activeTariffs: tariffsData.tariffs?.length || 0,
        activeFleet: fleetData.fleet?.length || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_name');
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!',
    });
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <nav className="border-b glass-effect">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Icon name="Shield" className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Админ-панель</h1>
                <p className="text-sm text-muted-foreground">Sochi Transfer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{adminName}</p>
                <p className="text-xs text-muted-foreground">Администратор</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Icon name="LogOut" className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: 'ShoppingCart', label: 'Всего заявок', value: stats.totalOrders, color: 'primary' },
            { icon: 'AlertCircle', label: 'Новых заявок', value: stats.newOrders, color: 'accent' },
            { icon: 'MapPin', label: 'Активных тарифов', value: stats.activeTariffs, color: 'secondary' },
            { icon: 'Car', label: 'Автомобилей', value: stats.activeFleet, color: 'primary' }
          ].map((stat, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl gradient-${stat.color} flex items-center justify-center`}>
                    <Icon name={stat.icon} className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="glass-effect p-1">
            <TabsTrigger value="orders" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
              Заявки
            </TabsTrigger>
            <TabsTrigger value="tariffs" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="MapPin" className="mr-2 h-4 w-4" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger value="fleet" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="Car" className="mr-2 h-4 w-4" />
              Автопарк
            </TabsTrigger>
            <TabsTrigger value="statuses" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="Tag" className="mr-2 h-4 w-4" />
              Статусы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="tariffs">
            <TariffsManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="fleet">
            <FleetManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="statuses">
            <StatusesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
