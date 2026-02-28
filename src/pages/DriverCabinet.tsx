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
  // assigned driver info (visible to passenger side, but we reuse interface)
  driver_name?: string;
  driver_phone?: string;
  driver_car?: string;
  driver_car_number?: string;
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

const carClassLabel = (c: string) =>
  ({ economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' }[c] || c);

const transferTypeLabel = (t: string) =>
  ({ individual: 'Индивидуальный', group: 'Групповой' }[t] || t);

const fmt = (n: number, decimals = 0) =>
  Number(n || 0).toFixed(decimals);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatsBar = ({ driver, onWithdraw }: { driver: DriverProfile; onWithdraw: () => void }) => (
  <div className="grid grid-cols-4 gap-2 mb-4">
    <button
      onClick={onWithdraw}
      className="bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm border border-border active:scale-95 transition-transform min-h-[64px] flex flex-col items-center justify-center"
    >
      <div className="text-lg font-bold text-primary leading-tight">{fmt(driver.balance)} ₽</div>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Баланс</p>
    </button>
    <div className="bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm border border-border min-h-[64px] flex flex-col items-center justify-center">
      <div className="text-lg font-bold leading-tight">{driver.total_orders || 0}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Заказов</p>
    </div>
    <div className="bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm border border-border min-h-[64px] flex flex-col items-center justify-center">
      <div className="text-lg font-bold leading-tight flex items-center gap-0.5">
        {fmt(driver.rating, 1)}
        <Icon name="Star" className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Рейтинг</p>
    </div>
    <div className="bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm border border-border min-h-[64px] flex flex-col items-center justify-center">
      <div className="text-lg font-bold leading-tight">{driver.commission_rate || 15}%</div>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Комиссия</p>
    </div>
  </div>
);

const BalanceWarning = () => (
  <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2.5">
    <Icon name="AlertTriangle" className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Недостаточно средств на балансе</p>
      <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
        Для принятия заказов необходимо пополнить баланс. Свяжитесь с менеджером.
      </p>
    </div>
  </div>
);

const CommissionBreakdown = ({
  price,
  driverAmount,
  commissionAmount,
  commissionRate,
}: {
  price: number;
  driverAmount: number;
  commissionAmount: number;
  commissionRate: number;
}) => (
  <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>Стоимость поездки</span>
      <span className="font-medium text-foreground">{fmt(price)} ₽</span>
    </div>
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>Комиссия платформы ({commissionRate || 15}%)</span>
      <span className="text-red-500">−{fmt(commissionAmount || price * (commissionRate || 15) / 100)} ₽</span>
    </div>
    <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5 mt-1.5">
      <span className="text-green-600">Вы получите</span>
      <span className="text-green-600">{fmt(driverAmount)} ₽</span>
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────

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
    } catch (e) {
      console.error('[DriverCabinet] loadData error:', e);
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const r = await fetch(`${API_URLS.drivers}&action=available_orders`);
      const data = await r.json();
      setAvailableOrders(data.orders || []);
    } catch (e) {
      console.error('[DriverCabinet] loadAvailableOrders error:', e);
    }
  };

  const loadReviews = async () => {
    try {
      const r = await fetch(`${API_URLS.reviews}&action=driver&driver_id=${driverId}`);
      const data = await r.json();
      setDriverReviews(data.reviews || []);
    } catch (e) {
      console.error('[DriverCabinet] loadReviews error:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const r = await fetch(`${API_URLS.balance}&action=transactions&driver_id=${driverId}`);
      const data = await r.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error('[DriverCabinet] loadTransactions error:', e);
    }
  };

  const toggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Driver-Id': driverId! },
        body: JSON.stringify({ action: 'set_online', is_online: value })
      });
    } catch (e) {
      console.error('[DriverCabinet] toggleOnline error:', e);
    }
  };

  const acceptOrder = async (orderId: number) => {
    if (!driver || driver.balance <= 0) {
      toast({ title: 'Пополните баланс', description: 'Принятие заказов заблокировано при нулевом балансе', variant: 'destructive' });
      return;
    }
    setAcceptingId(orderId);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Driver-Id': driverId! },
        body: JSON.stringify({ action: 'accept_order', order_id: orderId })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
      toast({ title: 'Заказ принят!', description: `Вы заработаете ${data.driver_amount} ₽` });
      await loadData();
    } catch (err: unknown) {
      console.error('[DriverCabinet] acceptOrder error:', err);
      toast({ title: 'Ошибка принятия заказа', description: err instanceof Error ? err.message : 'Неизвестная ошибка', variant: 'destructive' });
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
      toast({ title: 'Заявка на вывод создана', description: 'Ожидайте подтверждения менеджера' });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawRequisites('');
      loadTransactions();
    } catch (e) {
      console.error('[DriverCabinet] submitWithdraw error:', e);
      toast({ title: 'Ошибка при выводе', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    ['driver_token', 'driver_id', 'driver_name', 'driver_status'].forEach(k => localStorage.removeItem(k));
    navigate('/');
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = driver?.status === 'pending';
  const isRejected = driver?.status === 'rejected';
  const isBalanceLow = (driver?.balance ?? 0) <= 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* ── Sticky header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-3 max-w-2xl mx-auto">
          {/* Logo */}
          <button
            className="flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient text-sm hidden xs:inline">ПоехалиПро</span>
          </button>

          {/* Center: online toggle (only for active drivers) */}
          {driver?.is_active && (
            <div className="flex items-center gap-2">
              <Switch
                checked={isOnline}
                onCheckedChange={toggleOnline}
                id="online-toggle"
                className="data-[state=checked]:bg-green-500"
              />
              <Label
                htmlFor="online-toggle"
                className={`text-sm font-medium select-none ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {isOnline ? 'На линии' : 'Офлайн'}
              </Label>
            </div>
          )}

          {/* Right: driver avatar + logout */}
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {driverName.charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Выйти"
            >
              <Icon name="LogOut" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <main className="pt-14 pb-8 px-3 max-w-2xl mx-auto">

        {/* Status banners */}
        {isPending && (
          <div className="mt-4 mb-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="Clock" className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Заявка на проверке</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Менеджер проверит ваши документы в течение 24 часов.</p>
            </div>
          </div>
        )}
        {isRejected && (
          <div className="mt-4 mb-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="XCircle" className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Заявка отклонена</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">Свяжитесь с поддержкой для уточнения причин.</p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {driver && (
          <div className="mt-4">
            <StatsBar driver={driver} onWithdraw={() => setWithdrawOpen(true)} />
          </div>
        )}

        {/* Low balance warning */}
        {isBalanceLow && driver?.is_active && <BalanceWarning />}

        {/* ── Tabs ── */}
        <Tabs defaultValue={driver?.is_active ? 'available' : 'profile'}>

          {/* Horizontally scrollable tab list */}
          <div className="overflow-x-auto -mx-3 px-3 mb-4">
            <TabsList className="inline-flex w-max gap-0 h-10 bg-muted rounded-xl p-1">
              {driver?.is_active && (
                <>
                  <TabsTrigger
                    value="available"
                    className="relative text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                  >
                    Доступные
                    {availableOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {availableOrders.length > 9 ? '9+' : availableOrders.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="my_orders"
                    className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                  >
                    Мои заказы
                    {orders.length > 0 && (
                      <Badge className="ml-1.5 bg-muted-foreground/20 text-foreground text-[9px] h-4 px-1 rounded-full">{orders.length}</Badge>
                    )}
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger
                value="balance"
                className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Баланс
              </TabsTrigger>
              <TabsTrigger
                value="reviews_tab"
                className="relative text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Отзывы
                {driverReviews.length > 0 && (
                  <span className="ml-1.5 text-[9px] bg-yellow-500 text-white px-1 rounded-full">{driverReviews.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Профиль
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Available orders tab ── */}
          {driver?.is_active && (
            <TabsContent value="available" className="mt-0">
              {availableOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-14 text-center">
                    <Icon name="Search" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">Новых заказов пока нет</p>
                    <p className="text-xs text-muted-foreground mt-1">Обновляется каждые 15 секунд</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {isBalanceLow && (
                    <p className="text-xs text-center text-red-500 font-medium pb-1">
                      Принятие заказов заблокировано — пополните баланс
                    </p>
                  )}
                  {availableOrders.map(order => {
                    const isAccepting = acceptingId === order.id;
                    const blocked = isBalanceLow;
                    return (
                      <Card
                        key={order.id}
                        className={`border-2 transition-colors ${blocked ? 'border-border opacity-80' : 'border-primary/20 hover:border-primary/50'}`}
                      >
                        <CardContent className="p-4">
                          {/* Header row */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-base">Заказ #{order.id}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(order.pickup_datetime).toLocaleString('ru', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gradient">{fmt(order.price)} ₽</div>
                              <div className="text-[11px] text-muted-foreground">{transferTypeLabel(order.transfer_type)}</div>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="space-y-1 mb-3">
                            <div className="flex items-start gap-2 text-sm">
                              <Icon name="MapPin" className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{order.from_location}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                              <Icon name="Navigation" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="font-medium">{order.to_location}</span>
                            </div>
                          </div>

                          {/* Meta chips */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                              <Icon name="Users" className="h-3 w-3" />{order.passengers_count} пасс.
                            </span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">{carClassLabel(order.car_class)}</span>
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg p-2 mb-3 italic">
                              {order.notes}
                            </p>
                          )}

                          {/* Commission breakdown */}
                          <CommissionBreakdown
                            price={order.price}
                            driverAmount={order.driver_amount}
                            commissionAmount={order.commission_amount}
                            commissionRate={driver.commission_rate}
                          />

                          {/* Accept button */}
                          <Button
                            className="w-full mt-3 gradient-primary text-white min-h-[48px] text-base font-semibold disabled:opacity-50"
                            onClick={() => acceptOrder(order.id)}
                            disabled={isAccepting || blocked}
                          >
                            {isAccepting ? (
                              <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Принимаем...</>
                            ) : blocked ? (
                              <><Icon name="Lock" className="mr-2 h-4 w-4" />Заблокировано</>
                            ) : (
                              <><Icon name="CheckCircle2" className="mr-2 h-4 w-4" />Принять заказ</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}

          {/* ── My orders tab ── */}
          {driver?.is_active && (
            <TabsContent value="my_orders" className="mt-0">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-14 text-center">
                    <Icon name="PackageSearch" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">Выполненных заказов ещё нет</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        {/* Header row */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Заказ #{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={order.status_color ? { borderColor: order.status_color, color: order.status_color } : {}}
                          >
                            {order.status_name}
                          </Badge>
                        </div>

                        {/* Route */}
                        <div className="space-y-0.5 mb-3">
                          <div className="flex items-start gap-2 text-sm">
                            <Icon name="MapPin" className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground text-xs">{order.from_location}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Icon name="Navigation" className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-xs">{order.to_location}</span>
                          </div>
                        </div>

                        {/* Passenger info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Icon name="User" className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{order.passenger_name || 'Пассажир'}</span>
                          {order.passenger_phone && (
                            <a
                              href={`tel:${order.passenger_phone}`}
                              className="flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                            >
                              <Icon name="Phone" className="h-3 w-3" />
                              {order.passenger_phone}
                            </a>
                          )}
                        </div>

                        {/* Commission breakdown */}
                        <CommissionBreakdown
                          price={order.price}
                          driverAmount={order.driver_amount}
                          commissionAmount={order.commission_amount}
                          commissionRate={driver.commission_rate}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Balance tab ── */}
          <TabsContent value="balance" className="mt-0">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Текущий баланс</p>
                      <p className={`text-4xl font-bold ${isBalanceLow ? 'text-red-500' : 'text-gradient'}`}>
                        {fmt(driver?.balance ?? 0, 2)} ₽
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Icon name="Wallet" className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {isBalanceLow && (
                    <p className="text-xs text-red-500 mb-4 text-center">
                      Пополните баланс, чтобы принимать заказы
                    </p>
                  )}

                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-primary text-white min-h-[48px]">
                        <Icon name="ArrowUpRight" className="mr-2 h-4 w-4" />Вывести средства
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-3 rounded-xl">
                      <DialogHeader><DialogTitle>Вывод средств</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Доступно: <strong className="text-foreground">{fmt(driver?.balance ?? 0, 2)} ₽</strong>
                        </p>
                        <div>
                          <Label className="text-sm mb-1.5 block">Сумма (₽)</Label>
                          <Input
                            type="number"
                            placeholder="1000"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label className="text-sm mb-1.5 block">Реквизиты (карта / СБП)</Label>
                          <Textarea
                            placeholder="Номер карты или телефон для СБП..."
                            value={withdrawRequisites}
                            onChange={e => setWithdrawRequisites(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button className="w-full gradient-primary text-white min-h-[48px]" onClick={submitWithdraw}>
                          Отправить заявку
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Transaction history */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">История операций</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">Операций пока нет</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-3 min-h-[56px]">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className={`text-sm font-semibold flex-shrink-0 ${Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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

          {/* ── Reviews tab ── */}
          <TabsContent value="reviews_tab" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="Star" className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  Отзывы о вас
                  <span className="text-muted-foreground font-normal">({driverReviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {driverReviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Отзывов пока нет</p>
                ) : (
                  <div className="space-y-3">
                    {driverReviews.map(r => (
                      <div key={r.id} className="p-3 border border-border rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-sm">{r.author_name || 'Аноним'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Icon
                              key={i}
                              name="Star"
                              className={`h-4 w-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        {r.text && <p className="text-sm text-muted-foreground">{r.text}</p>}
                        {r.admin_reply && (
                          <div className="mt-2 p-2 bg-muted rounded-lg text-xs">
                            <span className="font-medium">Ответ: </span>{r.admin_reply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Profile tab ── */}
          <TabsContent value="profile" className="mt-0">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  {/* Driver header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg leading-tight">{driverName}</p>
                      {driver?.phone && (
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                      )}
                      <Badge
                        variant={driver?.is_active ? 'default' : 'secondary'}
                        className={`mt-1 text-xs ${driver?.is_active ? 'bg-green-500 text-white' : ''}`}
                      >
                        {driver?.status === 'approved' ? 'Активен' : driver?.status === 'pending' ? 'На проверке' : 'Отклонён'}
                      </Badge>
                    </div>
                  </div>

                  {driver && (
                    <>
                      {/* Car info block */}
                      <div className="bg-muted/50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Автомобиль</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Марка и модель</span>
                            <span className="font-medium">{driver.car_brand} {driver.car_model}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Цвет</span>
                            <span>{driver.car_color}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Номер</span>
                            <span className="font-mono font-semibold tracking-wider">{driver.car_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Commission info */}
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Условия работы</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Комиссия платформы</span>
                            <span className="font-semibold text-primary">{driver.commission_rate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Вы получаете с заказа</span>
                            <span className="font-semibold text-green-600">{100 - driver.commission_rate}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Button
                variant="destructive"
                className="w-full min-h-[48px]"
                onClick={handleLogout}
              >
                <Icon name="LogOut" className="mr-2 h-4 w-4" />Выйти из кабинета
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default DriverCabinet;
