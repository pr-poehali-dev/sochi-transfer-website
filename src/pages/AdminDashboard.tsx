import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';
import TariffsManager from '@/components/admin/TariffsManager';
import FleetManager from '@/components/admin/FleetManager';
import OrdersManager from '@/components/admin/OrdersManager';
import StatusesManager from '@/components/admin/StatusesManager';
import PaymentSettingsManager from '@/components/admin/PaymentSettingsManager';
import NewsManager from '@/components/admin/NewsManager';
import ReviewsManager from '@/components/admin/ReviewsManager';
import DriversManager from '@/components/admin/DriversManager';
import SiteSettingsManager from '@/components/admin/SiteSettingsManager';
import TransferClassesManager from '@/components/admin/TransferClassesManager';
import UsersManager from '@/components/admin/UsersManager';

interface Withdrawal {
  id: number;
  amount: number;
  requisites: string;
  status: string;
  admin_note: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  driver_name?: string;
  driver_phone?: string;
}

interface Deposit {
  id: number;
  amount: number;
  payment_method: string;
  status: string;
  admin_note: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  driver_name?: string;
  driver_phone?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('admin');
  const [stats, setStats] = useState({ totalOrders: 0, newOrders: 0, activeTariffs: 0, activeFleet: 0, pendingDrivers: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const name = localStorage.getItem('admin_name');
    const role = localStorage.getItem('admin_role') || 'admin';
    if (!token) { navigate('/admin/login'); return; }
    setAdminName(name || 'Администратор');
    setAdminRole(role);
    loadStats();
    loadFinance();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [ordersRes, tariffsRes, fleetRes, driversRes] = await Promise.all([
        fetch(API_URLS.orders),
        fetch(`${API_URLS.tariffs}?active=true`),
        fetch(`${API_URLS.fleet}?active=true`),
        fetch(`${API_URLS.drivers}&action=list`)
      ]);
      const ordersData = await ordersRes.json();
      const tariffsData = await tariffsRes.json();
      const fleetData = await fleetRes.json();
      const driversData = await driversRes.json();
      const pending = (driversData.drivers || []).filter((d: { status: string }) => d.status === 'pending').length;
      setStats({
        totalOrders: ordersData.orders?.length || 0,
        newOrders: ordersData.orders?.filter((o: { status_id: number }) => o.status_id === 1).length || 0,
        activeTariffs: tariffsData.tariffs?.length || 0,
        activeFleet: fleetData.fleet?.length || 0,
        pendingDrivers: pending
      });
    } catch { /* silent */ }
  };

  const loadFinance = async () => {
    try {
      const [wRes, dRes] = await Promise.all([
        fetch(`${API_URLS.balance}&action=withdrawals`),
        fetch(`${API_URLS.balance}&action=deposits`)
      ]);
      const wd = await wRes.json(); setWithdrawals(wd.withdrawals || []);
      const dd = await dRes.json(); setDeposits(dd.deposits || []);
    } catch { /* silent */ }
  };

  const approveWithdrawal = async (id: number) => {
    await fetch(API_URLS.balance, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_withdrawal', id })
    });
    toast({ title: 'Вывод одобрен' });
    loadFinance();
  };

  const rejectWithdrawal = async (id: number) => {
    await fetch(API_URLS.balance, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject_withdrawal', id })
    });
    toast({ title: 'Вывод отклонён' });
    loadFinance();
  };

  const approveDeposit = async (id: number) => {
    await fetch(API_URLS.balance, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_deposit', id })
    });
    toast({ title: 'Пополнение одобрено' });
    loadFinance();
  };

  const handleLogout = () => {
    ['admin_token', 'admin_email', 'admin_name', 'admin_role'].forEach(k => localStorage.removeItem(k));
    toast({ title: 'Выход выполнен' });
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <nav className="border-b glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Icon name="Shield" className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Админ-панель</h1>
                <p className="text-xs text-muted-foreground">ПоехалиПро</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{adminName}</p>
                <p className="text-xs text-muted-foreground capitalize">{adminRole === 'manager' ? 'Менеджер' : 'Администратор'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { icon: 'ShoppingCart', label: 'Всего заявок', value: stats.totalOrders },
            { icon: 'AlertCircle', label: 'Новых', value: stats.newOrders },
            { icon: 'MapPin', label: 'Тарифов', value: stats.activeTariffs },
            { icon: 'Car', label: 'Авто', value: stats.activeFleet },
            { icon: 'Users', label: 'На проверке', value: stats.pendingDrivers }
          ].map((stat, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Icon name={stat.icon} className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex min-w-max gap-0">
              <TabsTrigger value="orders">
                <Icon name="ShoppingCart" className="mr-1.5 h-4 w-4" />
                Заявки
              </TabsTrigger>
              <TabsTrigger value="drivers">
                <Icon name="Users" className="mr-1.5 h-4 w-4" />
                Водители
                {stats.pendingDrivers > 0 && (
                  <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {stats.pendingDrivers}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tariffs">
                <Icon name="MapPin" className="mr-1.5 h-4 w-4" />
                Тарифы
              </TabsTrigger>
              <TabsTrigger value="fleet">
                <Icon name="Car" className="mr-1.5 h-4 w-4" />
                Автопарк
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Icon name="Star" className="mr-1.5 h-4 w-4" />
                Отзывы
              </TabsTrigger>
              <TabsTrigger value="news">
                <Icon name="Newspaper" className="mr-1.5 h-4 w-4" />
                Новости
              </TabsTrigger>
              <TabsTrigger value="statuses">
                <Icon name="Tag" className="mr-1.5 h-4 w-4" />
                Статусы
              </TabsTrigger>
              <TabsTrigger value="payment">
                <Icon name="CreditCard" className="mr-1.5 h-4 w-4" />
                Оплата
              </TabsTrigger>
              <TabsTrigger value="finance">
                <Icon name="Wallet" className="mr-1.5 h-4 w-4" />
                Финансы
                {withdrawals.filter(w => w.status === 'pending').length + deposits.filter(d => d.status === 'pending').length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {withdrawals.filter(w => w.status === 'pending').length + deposits.filter(d => d.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users">
                <Icon name="UserCheck" className="mr-1.5 h-4 w-4" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="transfer_classes">
                <Icon name="Sliders" className="mr-1.5 h-4 w-4" />
                Типы/Классы
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Icon name="Settings" className="mr-1.5 h-4 w-4" />
                Настройки
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders">
            <OrdersManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversManager />
          </TabsContent>

          <TabsContent value="tariffs">
            <TariffsManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="fleet">
            <FleetManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManager />
          </TabsContent>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          <TabsContent value="statuses">
            <StatusesManager />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettingsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="transfer_classes">
            <TransferClassesManager />
          </TabsContent>

          <TabsContent value="finance">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Icon name="ArrowUpRight" className="h-5 w-5 text-red-500" />
                    Заявки на вывод средств
                    {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                      <Badge className="bg-red-500 text-white">{withdrawals.filter(w => w.status === 'pending').length} новых</Badge>
                    )}
                  </h3>
                  {withdrawals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">Заявок нет</p>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map(w => (
                        <div key={w.id} className={`p-4 border rounded-lg ${w.status === 'pending' ? 'border-yellow-300 bg-yellow-50/50' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{w.user_name || w.driver_name || 'Неизвестно'}</span>
                                <span className="text-xs text-muted-foreground">{w.user_phone || w.driver_phone}</span>
                                <Badge variant={w.status === 'pending' ? 'secondary' : w.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                                  {w.status === 'pending' ? 'Ожидает' : w.status === 'completed' ? 'Выполнен' : 'Отклонён'}
                                </Badge>
                              </div>
                              <p className="text-2xl font-bold text-gradient mb-1">{Number(w.amount).toFixed(2)} ₽</p>
                              <p className="text-sm text-muted-foreground">Реквизиты: {w.requisites}</p>
                              <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString('ru')}</p>
                            </div>
                            {w.status === 'pending' && (
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs" onClick={() => approveWithdrawal(w.id)}>
                                  <Icon name="Check" className="h-3 w-3 mr-1" />Выплатить
                                </Button>
                                <Button size="sm" variant="destructive" className="text-xs" onClick={() => rejectWithdrawal(w.id)}>
                                  <Icon name="X" className="h-3 w-3 mr-1" />Отклонить
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Icon name="Plus" className="h-5 w-5 text-green-500" />
                    Заявки на пополнение баланса
                    {deposits.filter(d => d.status === 'pending').length > 0 && (
                      <Badge className="bg-green-500 text-white">{deposits.filter(d => d.status === 'pending').length} новых</Badge>
                    )}
                  </h3>
                  {deposits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">Заявок нет</p>
                  ) : (
                    <div className="space-y-3">
                      {deposits.map(d => (
                        <div key={d.id} className={`p-4 border rounded-lg ${d.status === 'pending' ? 'border-green-300 bg-green-50/50' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{d.user_name || d.driver_name || 'Неизвестно'}</span>
                                <span className="text-xs text-muted-foreground">{d.user_phone || d.driver_phone}</span>
                                <Badge variant={d.status === 'pending' ? 'secondary' : d.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                                  {d.status === 'pending' ? 'Ожидает' : d.status === 'completed' ? 'Зачислено' : 'Отклонено'}
                                </Badge>
                              </div>
                              <p className="text-2xl font-bold text-green-600 mb-1">+{Number(d.amount).toFixed(2)} ₽</p>
                              <p className="text-sm text-muted-foreground">Способ: {d.payment_method || 'не указан'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString('ru')}</p>
                            </div>
                            {d.status === 'pending' && (
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs flex-shrink-0" onClick={() => approveDeposit(d.id)}>
                                <Icon name="Check" className="h-3 w-3 mr-1" />Зачислить
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;