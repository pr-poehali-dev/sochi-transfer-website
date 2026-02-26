import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Order {
  id: number;
  from_location: string;
  to_location: string;
  pickup_datetime: string;
  passenger_name: string;
  passenger_phone: string;
  price: number;
  driver_amount: number;
  commission_amount: number;
  transfer_type: string;
  car_class: string;
  passengers_count: number;
  notes: string;
  created_at: string;
  status_name: string;
  status_color: string;
}

interface DriverProfile {
  id: number;
  name: string;
  phone: string;
  status: string;
  is_active: boolean;
  is_online: boolean;
  balance: number;
  commission_rate: number;
  rating: number;
  total_orders: number;
  car_brand: string;
  car_model: string;
  car_color: string;
  car_number: string;
}

interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
  admin_reply?: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const DriverCabinet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [driverReviews, setDriverReviews] = useState<Review[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRequisites, setWithdrawRequisites] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const driverId = localStorage.getItem('driver_id');
  const driverName = localStorage.getItem('driver_name') || 'Водитель';

  useEffect(() => {
    if (!driverId) { navigate('/driver/login'); return; }
    loadData();
  }, [driverId]);

  useEffect(() => {
    if (!driver?.is_active) return;
    const interval = setInterval(loadAvailableOrders, 15000);
    return () => clearInterval(interval);
  }, [driver?.is_active]);

  const loadData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch(`${API_URLS.drivers}&action=profile&driver_id=${driverId}`),
        fetch(`${API_URLS.drivers}&action=orders&driver_id=${driverId}`)
      ]);
      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();
      setDriver(profileData.driver);
      setIsOnline(profileData.driver?.is_online || false);
      setOrders(ordersData.orders || []);
      if (profileData.driver?.is_active) {
        await loadAvailableOrders();
      }
      loadReviews();
      loadTransactions();
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    const r = await fetch(`${API_URLS.drivers}&action=available_orders`);
    const data = await r.json();
    setAvailableOrders(data.orders || []);
  };

  const loadReviews = async () => {
    try {
      const r = await fetch(`${API_URLS.reviews}&action=driver&driver_id=${driverId}`);
      const data = await r.json();
      setDriverReviews(data.reviews || []);
    } catch (e) { console.error(e); }
  };

  const loadTransactions = async () => {
    try {
      const r = await fetch(`${API_URLS.balance}&action=transactions&driver_id=${driverId}`);
      const data = await r.json();
      setTransactions(data.transactions || []);
    } catch (e) { console.error(e); }
  };

  const toggleOnline = async (value: boolean) => {
    setIsOnline(value);
    await fetch(API_URLS.drivers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Driver-Id': driverId! },
      body: JSON.stringify({ action: 'set_online', is_online: value })
    });
  };

  const acceptOrder = async (orderId: number) => {
    setAcceptingId(orderId);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Driver-Id': driverId! },
        body: JSON.stringify({ action: 'accept_order', order_id: orderId })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: 'Заказ принят!', description: `Вы заработаете ${data.driver_amount} ₽` });
      await loadData();
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setAcceptingId(null);
    }
  };

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawRequisites) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: parseFloat(withdrawAmount), requisites: withdrawRequisites, driver_id: driverId })
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на вывод создана', description: 'Ожидайте подтверждения' });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawRequisites('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const handleLogout = () => {
    ['driver_token', 'driver_id', 'driver_name', 'driver_status'].forEach(k => localStorage.removeItem(k));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = driver?.status === 'pending';
  const isRejected = driver?.status === 'rejected';

  const carClass = (c: string) => ({ economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' }[c] || c);
  const transferType = (t: string) => ({ individual: 'Индивидуальный', group: 'Групповой' }[t] || t);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gradient">ПоехалиПро</span>
            </div>
            <div className="flex items-center gap-3">
              {driver?.is_active && (
                <div className="flex items-center gap-2">
                  <Switch checked={isOnline} onCheckedChange={toggleOnline} id="online-toggle" />
                  <Label htmlFor="online-toggle" className={`text-sm ${isOnline ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {isOnline ? 'На линии' : 'Не в сети'}
                  </Label>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {isPending && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="Clock" className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Заявка на проверке</p>
              <p className="text-sm text-yellow-700">Менеджер проверит ваши документы в течение 24 часов.</p>
            </div>
          </div>
        )}
        {isRejected && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="XCircle" className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Заявка отклонена</p>
              <p className="text-sm text-red-700">Свяжитесь с поддержкой для уточнения причин.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gradient">{Number(driver?.balance || 0).toFixed(0)} ₽</div>
              <p className="text-xs text-muted-foreground mt-1">Баланс</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{driver?.total_orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Заказов</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {Number(driver?.rating || 0).toFixed(1)}
                <Icon name="Star" className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Рейтинг</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{driver?.commission_rate || 15}%</div>
              <p className="text-xs text-muted-foreground mt-1">Комиссия</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={driver?.is_active ? 'available' : 'profile'}>
          <div className="overflow-x-auto mb-6">
            <TabsList className="inline-flex min-w-max">
              {driver?.is_active && (
                <>
                  <TabsTrigger value="available">
                    Доступные
                    {availableOrders.length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs h-5 px-1.5">{availableOrders.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="my_orders">Мои заказы</TabsTrigger>
                </>
              )}
              <TabsTrigger value="balance">Баланс</TabsTrigger>
              <TabsTrigger value="reviews_tab">
                Отзывы
                {driverReviews.length > 0 && <Badge className="ml-2 bg-yellow-500 text-white text-xs h-5 px-1.5">{driverReviews.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="profile">Профиль</TabsTrigger>
            </TabsList>
          </div>

          {driver?.is_active && (
            <TabsContent value="available">
              {availableOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Icon name="Search" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Новых заказов пока нет</p>
                    <p className="text-sm text-muted-foreground mt-1">Обновляется каждые 15 секунд</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <Card key={order.id} className="border-2 border-primary/20 hover:border-primary/50 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">Заказ #{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.pickup_datetime).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gradient">{order.price} ₽</div>
                            <div className="text-xs text-muted-foreground">{transferType(order.transfer_type)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <Icon name="MapPin" className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{order.from_location}</span>
                          <Icon name="ArrowRight" className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium truncate">{order.to_location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1"><Icon name="Users" className="h-4 w-4" />{order.passengers_count} пасс.</span>
                          <span>{carClass(order.car_class)}</span>
                        </div>
                        {order.notes && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3">{order.notes}</p>
                        )}
                        <Button className="w-full gradient-primary text-white" onClick={() => acceptOrder(order.id)}
                          disabled={acceptingId === order.id}>
                          {acceptingId === order.id
                            ? <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                            : <Icon name="CheckCircle2" className="mr-2 h-4 w-4" />}
                          Принять заказ
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {driver?.is_active && (
            <TabsContent value="my_orders">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Icon name="PackageSearch" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Выполненных заказов ещё нет</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Заказ #{order.id}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ru')}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-600">+{Number(order.driver_amount || 0).toFixed(0)} ₽</span>
                            <p className="text-xs text-muted-foreground">из {order.price} ₽</p>
                          </div>
                        </div>
                        <p className="text-sm">{order.from_location} → {order.to_location}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{order.passenger_name}</span>
                          <Badge variant="outline" className="text-xs">{order.status_name}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="balance">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Баланс</p>
                      <p className="text-4xl font-bold text-gradient">{Number(driver?.balance || 0).toFixed(2)} ₽</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                      <Icon name="Wallet" className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-primary text-white">
                        <Icon name="ArrowUpRight" className="mr-2 h-4 w-4" />Вывести средства
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Вывод средств</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Доступно: <strong>{Number(driver?.balance || 0).toFixed(2)} ₽</strong></p>
                        <div>
                          <Label>Сумма (₽)</Label>
                          <Input type="number" placeholder="1000" value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)} />
                        </div>
                        <div>
                          <Label>Реквизиты (карта / СБП)</Label>
                          <Textarea placeholder="Номер карты или телефон для СБП..."
                            value={withdrawRequisites} onChange={e => setWithdrawRequisites(e.target.value)} rows={3} />
                        </div>
                        <Button className="w-full gradient-primary text-white" onClick={submitWithdraw}>Отправить заявку</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>История операций</CardTitle></CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">Операций пока нет</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{t.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('ru')}</p>
                          </div>
                          <div className={`font-semibold ${Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(t.amount) >= 0 ? '+' : ''}{Number(t.amount).toFixed(2)} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews_tab">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Star" className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  Отзывы о вас ({driverReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {driverReviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Отзывов пока нет</p>
                ) : (
                  <div className="space-y-4">
                    {driverReviews.map(r => (
                      <div key={r.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{r.author_name || 'Аноним'}</span>
                          <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ru')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.text}</p>
                        {r.admin_reply && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <span className="font-medium">Ответ:</span> {r.admin_reply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{driverName}</p>
                      <Badge variant={driver?.is_active ? 'default' : 'secondary'} className={driver?.is_active ? 'bg-green-500' : ''}>
                        {driver?.status === 'approved' ? 'Активен' : driver?.status === 'pending' ? 'На проверке' : 'Отклонён'}
                      </Badge>
                    </div>
                  </div>
                  {driver && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Автомобиль</span>
                        <span className="font-medium">{driver.car_brand} {driver.car_model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Цвет</span>
                        <span>{driver.car_color}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Номер</span>
                        <span className="font-mono font-medium">{driver.car_number}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Телефон</span>
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Комиссия платформы</span>
                        <span className="font-medium">{driver.commission_rate}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <Icon name="LogOut" className="mr-2 h-4 w-4" />Выйти
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverCabinet;
