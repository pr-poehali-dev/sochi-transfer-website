import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
import ManagersManager from '@/components/admin/ManagersManager';
import RideshareOrdersManager from '@/components/admin/RideshareOrdersManager';

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

interface StatsType {
  totalOrders: number;
  newOrders: number;
  activeTariffs: number;
  activeFleet: number;
  pendingDrivers: number;
  activeRideshares: number;
}

const AnalyticsTab = ({ stats }: { stats: StatsType }) => {
  const [analyticsData, setAnalyticsData] = useState<{orders_by_day: {date: string; count: number}[]; users_count: number; drivers_count: number; revenue_total: number; orders_completed: number; metrika_id: string}>({
    orders_by_day: [], users_count: 0, drivers_count: 0, revenue_total: 0, orders_completed: 0, metrika_id: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, usersRes, driversRes, settingsRes] = await Promise.all([
          fetch(API_URLS.orders),
          fetch(`${API_URLS.users}&action=list`),
          fetch(`${API_URLS.drivers}&action=list`),
          fetch(API_URLS.settings),
        ]);
        const oData = await ordersRes.json();
        const uData = await usersRes.json();
        const dData = await driversRes.json();
        const sData = await settingsRes.json();

        const orders = oData.orders || [];
        const completedOrders = orders.filter((o: {status_id: number}) => o.status_id === 4);
        const revenue = completedOrders.reduce((sum: number, o: {price: number}) => sum + Number(o.price || 0), 0);

        const byDay: Record<string, number> = {};
        orders.forEach((o: {created_at: string}) => {
          const d = new Date(o.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          byDay[d] = (byDay[d] || 0) + 1;
        });
        const last14 = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        }).map(date => ({ date, count: byDay[date] || 0 }));

        setAnalyticsData({
          orders_by_day: last14,
          users_count: (uData.users || []).length,
          drivers_count: (dData.drivers || []).filter((d: {is_active: boolean}) => d.is_active).length,
          revenue_total: revenue,
          orders_completed: completedOrders.length,
          metrika_id: (sData.settings || {})['yandex_metrika_id'] || '',
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Пользователей', value: analyticsData.users_count, icon: 'Users', color: 'text-blue-600' },
          { label: 'Водителей активных', value: analyticsData.drivers_count, icon: 'Car', color: 'text-green-600' },
          { label: 'Заказов завершено', value: analyticsData.orders_completed, icon: 'CheckCircle2', color: 'text-primary' },
          { label: 'Выручка (завершённые)', value: `${analyticsData.revenue_total.toLocaleString('ru-RU')} ₽`, icon: 'TrendingUp', color: 'text-amber-600' },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
                <Icon name={item.icon} className={`h-8 w-8 ${item.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Заказы за последние 14 дней</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.orders_by_day}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Заказов" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {analyticsData.metrika_id ? (
        <Card>
          <CardHeader><CardTitle>Яндекс.Метрика</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p className="font-semibold mb-1">Яндекс.Метрика подключена (ID: {analyticsData.metrika_id})</p>
              <p className="text-xs">Полная статистика посещений доступна в <a href={`https://metrika.yandex.ru/stat/traffic?id=${analyticsData.metrika_id}`} target="_blank" rel="noopener noreferrer" className="underline">Яндекс.Метрике</a></p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Аналитика посещений</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Для отслеживания посещений сайта подключите Яндекс.Метрику:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Зайдите в <a href="https://metrika.yandex.ru" target="_blank" rel="noopener noreferrer" className="text-primary underline">metrika.yandex.ru</a></li>
                <li>Добавьте счётчик для вашего сайта</li>
                <li>Скопируйте ID счётчика (число)</li>
                <li>Вставьте ID в <strong>Настройки → Яндекс.Метрика</strong></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('admin');
  const [stats, setStats] = useState<StatsType>({ totalOrders: 0, newOrders: 0, activeTariffs: 0, activeFleet: 0, pendingDrivers: 0, activeRideshares: 0 });
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
      const [ordersRes, tariffsRes, fleetRes, driversRes, ridesharesRes] = await Promise.all([
        fetch(API_URLS.orders),
        fetch(`${API_URLS.tariffs}?active=true`),
        fetch(`${API_URLS.fleet}?active=true`),
        fetch(`${API_URLS.drivers}&action=list`),
        fetch('https://functions.poehali.dev/bb30d9f0-aad2-4e73-a102-04fb8211f7ae?resource=rideshares&admin=true')
      ]);
      const ordersData = await ordersRes.json();
      const tariffsData = await tariffsRes.json();
      const fleetData = await fleetRes.json();
      const driversData = await driversRes.json();
      const ridesharesData = await ridesharesRes.json();
      const pending = (driversData.drivers || []).filter((d: { status: string }) => d.status === 'pending').length;
      const activeRideshares = (ridesharesData.rideshares || []).filter((r: { status: string }) => r.status === 'active').length;
      setStats({
        totalOrders: ordersData.orders?.length || 0,
        newOrders: ordersData.orders?.filter((o: { status_id: number }) => o.status_id === 1).length || 0,
        activeTariffs: tariffsData.tariffs?.length || 0,
        activeFleet: fleetData.fleet?.length || 0,
        pendingDrivers: pending,
        activeRideshares
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { icon: 'ShoppingCart', label: 'Всего заявок', value: stats.totalOrders },
            { icon: 'AlertCircle', label: 'Новых', value: stats.newOrders },
            { icon: 'MapPin', label: 'Тарифов', value: stats.activeTariffs },
            { icon: 'Car', label: 'Авто', value: stats.activeFleet },
            { icon: 'Users', label: 'На проверке', value: stats.pendingDrivers },
            { icon: 'Users2', label: 'Попутчики', value: stats.activeRideshares }
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

        <Tabs defaultValue="transfer_orders" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="inline-flex min-w-max gap-0 h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger value="transfer_orders">
                <Icon name="ShoppingCart" className="mr-1.5 h-4 w-4" />
                Трансферы
              </TabsTrigger>
              <TabsTrigger value="rideshares">
                <Icon name="Users2" className="mr-1.5 h-4 w-4" />
                Попутчики
                {stats.activeRideshares > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {stats.activeRideshares}
                  </span>
                )}
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
              <TabsTrigger value="analytics">
                <Icon name="BarChart3" className="mr-1.5 h-4 w-4" />
                Статистика
              </TabsTrigger>
              <TabsTrigger value="team">
                <Icon name="UserCog" className="mr-1.5 h-4 w-4" />
                Команда
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transfer_orders">
            <OrdersManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="rideshares">
            <RideshareOrdersManager />
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

          <TabsContent value="team">
            <ManagersManager />
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

          <TabsContent value="analytics">
            <AnalyticsTab stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;