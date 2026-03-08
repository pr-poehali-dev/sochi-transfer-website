import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import OrderChat from '@/components/OrderChat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: number;
  from_location: string;
  to_location: string;
  pickup_datetime: string;
  price: number;
  status_name: string;
  status_color: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  car_brand?: string | null;
  car_model?: string | null;
  car_color?: string | null;
  car_number?: string | null;
  driver_rating?: number | null;
  transfer_type: string;
  car_class: string;
  passenger_name?: string;
  passenger_phone?: string;
  payment_type?: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface Tariff {
  id: number;
  city: string;
  price: number;
}

interface CarClass {
  value: string;
  label: string;
  price_multiplier: number;
}

interface PaymentSettings {
  payment_provider?: string;
  allow_cash?: boolean;
  allow_prepay?: boolean;
  prepay_percent?: number;
  allow_full_payment?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 0) => Number(n || 0).toFixed(dec);

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('ru', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });

const transferTypeLabel = (v: string) =>
  ({ individual: 'Индивидуальный', group: 'Групповой' }[v] ?? v);

const carClassLabel = (v: string) =>
  ({ economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' }[v] ?? v);

const CAR_CLASSES_DEFAULT: CarClass[] = [
  { value: 'economy', label: 'Эконом', price_multiplier: 1.0 },
  { value: 'comfort', label: 'Комфорт', price_multiplier: 1.3 },
  { value: 'business', label: 'Бизнес', price_multiplier: 1.7 },
  { value: 'minivan', label: 'Минивэн', price_multiplier: 1.5 },
];

const statusBg = (color: string) => {
  const map: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#EF4444': 'bg-red-100 text-red-800',
    '#8B5CF6': 'bg-purple-100 text-purple-800',
    '#F97316': 'bg-orange-100 text-orange-800',
    '#6B7280': 'bg-gray-100 text-gray-700',
  };
  return map[color] ?? 'bg-blue-100 text-blue-800';
};

function nowDtLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ─── Driver card ─────────────────────────────────────────────────────────────

const DriverCard = ({ order }: { order: Order }) => {
  if (!order.driver_name) return null;
  const initials = order.driver_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const carLine = [order.car_brand, order.car_model, order.car_color].filter(Boolean).join(' ');
  return (
    <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ваш водитель назначен</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight">{order.driver_name}</p>
          {order.driver_rating && order.driver_rating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="Star" className={`h-3.5 w-3.5 ${i < Math.round(order.driver_rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{Number(order.driver_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
        {order.driver_phone && (
          <a href={`tel:${order.driver_phone}`} className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center flex-shrink-0 transition-colors" aria-label="Позвонить водителю">
            <Icon name="Phone" className="h-5 w-5 text-white" />
          </a>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {carLine && (
          <div className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Icon name="Car" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-medium">{carLine}</span>
          </div>
        )}
        {order.car_number && (
          <div className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Icon name="Hash" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest">{order.car_number}</span>
          </div>
        )}
        {order.driver_phone && (
          <a href={`tel:${order.driver_phone}`} className="flex items-center gap-1.5 bg-white/70 hover:bg-green-100 rounded-lg px-2.5 py-1.5 transition-colors">
            <Icon name="Phone" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-medium text-green-700">{order.driver_phone}</span>
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Order card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onReview, userId }: { order: Order; onReview: (id: number) => void; userId: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const hasDriver = !!order.driver_name;
  const isCompleted = order.status_name === 'Выполнен';

  return (
    <Card className={`border transition-shadow ${hasDriver && !isCompleted ? 'border-green-200 shadow-green-50' : 'border-border'} ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      <button type="button" className="w-full text-left" onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">#{order.id}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBg(order.status_color)}`}>
                  {order.status_name}
                </span>
                {hasDriver && !isCompleted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Водитель в пути
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center gap-0.5 shrink-0 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="w-px h-3 bg-muted-foreground/25" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{order.from_location}</p>
                  <p className="text-sm text-muted-foreground leading-tight truncate mt-[6px]">{order.to_location}</p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-base text-gradient">{Number(order.price).toLocaleString('ru-RU')} ₽</p>
              <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(order.pickup_datetime)}</p>
            </div>
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-1">Тип</p>
              <p className="font-medium">{transferTypeLabel(order.transfer_type)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-1">Класс авто</p>
              <p className="font-medium">{carClassLabel(order.car_class)}</p>
            </div>
            {order.passenger_name && (
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-muted-foreground mb-1">Пассажир</p>
                <p className="font-medium truncate">{order.passenger_name}</p>
              </div>
            )}
            {order.passenger_phone && (
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-muted-foreground mb-1">Телефон</p>
                <a href={`tel:${order.passenger_phone}`} className="font-medium text-primary">{order.passenger_phone}</a>
              </div>
            )}
          </div>

          <DriverCard order={order} />

          {hasDriver && !isCompleted && (
            <>
              <button
                type="button"
                onClick={() => setChatOpen(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-sm font-medium transition-colors min-h-[44px]"
              >
                <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                {chatOpen ? 'Скрыть чат' : 'Написать водителю'}
              </button>
              {chatOpen && <OrderChat orderId={order.id} senderType="user" senderId={userId} compact />}
            </>
          )}

          {hasDriver && isCompleted && (
            <Button size="sm" variant="outline" className="w-full min-h-[44px] border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={() => onReview(order.id)}>
              <Icon name="Star" className="mr-2 h-4 w-4 text-yellow-500" />
              Оставить отзыв о водителе
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Review
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Balance
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRequisites, setWithdrawRequisites] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);

  // New order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [carClasses, setCarClasses] = useState<CarClass[]>(CAR_CLASSES_DEFAULT);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({
    tariff_id: '',
    from_location: '',
    to_location: '',
    pickup_datetime: '',
    passengers_count: '1',
    car_class: 'comfort',
    flight_number: '',
    notes: '',
    payment_type: 'cash',
    passenger_name: '',
    passenger_phone: '',
  });

  // Push
  const { state: pushState, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, isSupported: pushSupported } = usePushNotifications();
  const [pushLoading, setPushLoading] = useState(false);

  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name') || 'Пользователь';
  const userPhone = localStorage.getItem('user_phone') || '';

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) { navigate('/auth'); return; }
    loadOrders();
    loadBalance();
    loadFormData();
  }, [userId]);

  // Pre-fill form with user data
  useEffect(() => {
    setOrderForm(f => ({
      ...f,
      passenger_name: userName !== 'Пользователь' ? userName : '',
      passenger_phone: userPhone,
    }));
  }, [userName, userPhone]);

  const loadOrders = async () => {
    try {
      const r = await fetch(`${API_URLS.users}&action=orders&user_id=${userId}`);
      const data = await r.json();
      setOrders(data.orders || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить заказы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const r = await fetch(`${API_URLS.users}&action=profile&user_id=${userId}`);
      const data = await r.json();
      setBalance(Number(data.user?.balance || 0));
    } catch { /* silent */ }
    try {
      const r2 = await fetch(`${API_URLS.balance}&action=transactions&user_id=${userId}`);
      const data2 = await r2.json();
      setTransactions(data2.transactions || []);
    } catch { /* silent */ }
  };

  const loadFormData = async () => {
    try {
      const [tRes, ccRes, psRes] = await Promise.all([
        fetch(`${API_URLS.tariffs}?active=true`),
        fetch(`${API_URLS.carClasses}&active=true`),
        fetch(API_URLS.paymentSettings),
      ]);
      const tData = await tRes.json();
      const ccData = await ccRes.json();
      const psData = await psRes.json();
      if (tData.tariffs?.length) setTariffs(tData.tariffs);
      if (ccData.car_classes?.length) setCarClasses(ccData.car_classes);
      if (psData.settings) setPaymentSettings(psData.settings);
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    ['user_token', 'user_id', 'user_name', 'user_phone'].forEach(k => localStorage.removeItem(k));
    navigate('/');
  };

  // ── Review ─────────────────────────────────────────────────────────────────

  const openReview = (orderId: number) => {
    setReviewOrder(orders.find(o => o.id === orderId) ?? null);
    setReviewRating(5);
    setReviewText('');
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      await fetch(API_URLS.reviews, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), order_id: reviewOrder?.id ?? null, author_name: userName, rating: reviewRating, text: reviewText, type: 'driver' }),
      });
      toast({ title: 'Отзыв отправлен', description: 'Отзыв проходит модерацию' });
      setReviewDialogOpen(false);
      setReviewOrder(null);
      setReviewText('');
      setReviewRating(5);
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Balance ────────────────────────────────────────────────────────────────

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawRequisites) { toast({ title: 'Заполните все поля', variant: 'destructive' }); return; }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: parseFloat(withdrawAmount), requisites: withdrawRequisites, user_id: userId }),
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на вывод создана', description: 'Ожидайте подтверждения администратора' });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawRequisites('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const submitDeposit = async () => {
    if (!depositAmount) { toast({ title: 'Укажите сумму', variant: 'destructive' }); return; }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', amount: parseFloat(depositAmount), payment_method: depositMethod, user_id: userId }),
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на пополнение создана' });
      setDepositOpen(false);
      setDepositAmount('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  // ── Create order ───────────────────────────────────────────────────────────

  const computedPrice = (() => {
    const t = tariffs.find(tt => tt.id === parseInt(orderForm.tariff_id));
    const cc = carClasses.find(c => c.value === orderForm.car_class);
    if (!t) return 0;
    return Math.round(Number(t.price) * Number(cc?.price_multiplier || 1));
  })();

  const handleCreateOrder = async () => {
    if (!orderForm.from_location || !orderForm.to_location) {
      toast({ title: 'Укажите маршрут', variant: 'destructive' }); return;
    }
    if (!orderForm.pickup_datetime) {
      toast({ title: 'Укажите дату и время', variant: 'destructive' }); return;
    }
    const name = orderForm.passenger_name.trim() || userName;
    const phone = orderForm.passenger_phone.trim();
    if (!name) { toast({ title: 'Укажите ваше Ф.И.О.', variant: 'destructive' }); return; }
    if (!phone) { toast({ title: 'Укажите номер телефона', variant: 'destructive' }); return; }

    setOrderLoading(true);
    try {
      const isCash = orderForm.payment_type === 'cash';
      const hasProvider = paymentSettings.payment_provider && paymentSettings.payment_provider !== 'none';

      const res = await fetch(API_URLS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({
          from_location: orderForm.from_location,
          to_location: orderForm.to_location,
          pickup_datetime: orderForm.pickup_datetime,
          passengers_count: parseInt(orderForm.passengers_count),
          car_class: orderForm.car_class,
          flight_number: orderForm.flight_number,
          notes: orderForm.notes,
          tariff_id: orderForm.tariff_id ? parseInt(orderForm.tariff_id) : null,
          price: computedPrice || undefined,
          passenger_name: name,
          passenger_phone: phone,
          user_id: parseInt(userId || '0'),
          payment_type: isCash ? 'cash' : orderForm.payment_type === 'prepay' ? 'prepay' : 'full',
          transfer_type: 'individual',
          force_payment: !isCash && !!hasProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания заказа');

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast({ title: `Заказ #${data.id} создан!`, description: isCash ? 'Оплата — наличными при встрече' : 'Водитель свяжется с вами' });
        setShowOrderForm(false);
        setOrderForm(f => ({ ...f, tariff_id: '', from_location: '', to_location: '', pickup_datetime: '', flight_number: '', notes: '', payment_type: 'cash' }));
        loadOrders();
      }
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeOrders = orders.filter(o => o.driver_name && o.status_name !== 'Выполнен' && o.status_name !== 'Отменён');
  const ordersWithDriver = orders.filter(o => o.driver_name);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between">
          <button className="flex items-center gap-1.5 min-h-[44px]" onClick={() => navigate('/')}>
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient hidden xs:inline">ПоехалиПро</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0)}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[120px]">{userName}</span>
            <button onClick={handleLogout} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Выйти">
              <Icon name="LogOut" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14 pb-10 px-3 max-w-2xl mx-auto">

        {/* Active ride banner */}
        {activeOrders.length > 0 && (
          <div className="mt-4 mb-3 space-y-2">
            {activeOrders.map(order => (
              <div key={order.id} className="rounded-xl border-2 border-green-400 bg-green-50 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Icon name="Car" className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-800 text-sm leading-tight">Водитель назначен — {order.driver_name}</p>
                  <p className="text-xs text-green-600 truncate">{order.from_location} → {order.to_location}</p>
                </div>
                {order.driver_phone && (
                  <a href={`tel:${order.driver_phone}`} className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon name="Phone" className="h-4 w-4 text-white" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 mb-4">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-muted-foreground text-sm">{userName}</p>
        </div>

        <Tabs defaultValue="orders">
          <div className="overflow-x-auto -mx-3 px-3 mb-4">
            <TabsList className="inline-flex w-max gap-0 h-10 bg-muted rounded-xl p-1">
              <TabsTrigger value="orders" className="relative text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
                Мои заказы
                {orders.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted-foreground/20 text-foreground px-1.5 rounded-full">{orders.length}</span>
                )}
                {ordersWithDriver.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </TabsTrigger>
              <TabsTrigger value="new-order" className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
                <Icon name="Plus" className="h-3 w-3 mr-1" />
                Новый заказ
              </TabsTrigger>
              <TabsTrigger value="balance" className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
                Баланс
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
                Профиль
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══ ORDERS TAB ══ */}
          <TabsContent value="orders" className="mt-0">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <Icon name="PackageSearch" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium mb-4">У вас ещё нет заказов</p>
                  <Button className="gradient-primary text-white min-h-[44px]" onClick={() => navigate('/')}>
                    Заказать трансфер
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} onReview={openReview} userId={Number(userId)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══ NEW ORDER TAB ══ */}
          <TabsContent value="new-order" className="mt-0">
            <div className="space-y-4">
              {/* Header card */}
              <div className="rounded-2xl gradient-primary p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="Navigation" className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base">Заказ трансфера</p>
                    <p className="text-white/80 text-xs">Персональный автомобиль с водителем</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">

                  {/* Direction */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Маршрут</Label>
                    {tariffs.length > 0 ? (
                      <Select
                        value={orderForm.tariff_id}
                        onValueChange={v => {
                          const t = tariffs.find(tt => tt.id === parseInt(v));
                          setOrderForm(f => ({ ...f, tariff_id: v, from_location: 'Аэропорт Сочи', to_location: t ? t.city : '' }));
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Выберите направление" />
                        </SelectTrigger>
                        <SelectContent>
                          {tariffs.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              Аэропорт Сочи → {t.city} (от {Number(t.price).toLocaleString('ru-RU')} ₽)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Icon name="MapPin" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                          <Input className="h-12 pl-9" placeholder="Откуда" value={orderForm.from_location} onChange={e => setOrderForm(f => ({ ...f, from_location: e.target.value }))} />
                        </div>
                        <div className="relative">
                          <Icon name="Navigation" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />
                          <Input className="h-12 pl-9" placeholder="Куда" value={orderForm.to_location} onChange={e => setOrderForm(f => ({ ...f, to_location: e.target.value }))} />
                        </div>
                      </div>
                    )}
                    {orderForm.tariff_id && (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border">
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="w-px h-3 bg-muted-foreground/30" />
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none">{orderForm.from_location}</p>
                          <p className="text-xs text-muted-foreground mt-1">{orderForm.to_location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Car class */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Класс автомобиля</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {carClasses.map(cls => {
                        const active = orderForm.car_class === cls.value;
                        const clsPrice = orderForm.tariff_id
                          ? Math.round(Number(tariffs.find(t => t.id === parseInt(orderForm.tariff_id))?.price || 0) * Number(cls.price_multiplier))
                          : 0;
                        return (
                          <button
                            key={cls.value}
                            type="button"
                            onClick={() => setOrderForm(f => ({ ...f, car_class: cls.value }))}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
                          >
                            <p className={`text-sm font-semibold ${active ? 'text-primary' : ''}`}>{cls.label}</p>
                            {clsPrice > 0 && <p className={`text-xs mt-0.5 ${active ? 'text-primary/70' : 'text-muted-foreground'}`}>{clsPrice.toLocaleString('ru-RU')} ₽</p>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date + Passengers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Дата и время</Label>
                      <div className="relative">
                        <Icon name="Calendar" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input className="h-12 pl-9" type="datetime-local" min={nowDtLocal()} value={orderForm.pickup_datetime} onChange={e => setOrderForm(f => ({ ...f, pickup_datetime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Пассажиров</Label>
                      <Select value={orderForm.passengers_count} onValueChange={v => setOrderForm(f => ({ ...f, passengers_count: v }))}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'пассажир' : n <= 4 ? 'пассажира' : 'пассажиров'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* FIO */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ф.И.О. пассажира</Label>
                    <div className="relative">
                      <Icon name="User" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input className="h-12 pl-9" placeholder="Иванов Иван Иванович" value={orderForm.passenger_name} onChange={e => setOrderForm(f => ({ ...f, passenger_name: e.target.value }))} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Номер телефона</Label>
                    <div className="relative">
                      <Icon name="Phone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input className="h-12 pl-9" type="tel" inputMode="tel" placeholder="+7 (900) 000-00-00" value={orderForm.passenger_phone} onChange={e => setOrderForm(f => ({ ...f, passenger_phone: e.target.value }))} />
                    </div>
                  </div>

                  {/* Flight number */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Номер рейса <span className="normal-case font-normal text-muted-foreground">(необязательно)</span>
                    </Label>
                    <div className="relative">
                      <Icon name="Plane" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input className="h-12 pl-9" placeholder="SU 1234" value={orderForm.flight_number} onChange={e => setOrderForm(f => ({ ...f, flight_number: e.target.value }))} />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Комментарий <span className="normal-case font-normal text-muted-foreground">(необязательно)</span>
                    </Label>
                    <Textarea className="resize-none" placeholder="Детское кресло, встреча с табличкой, особые пожелания..." rows={2} value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              {/* Price & Payment */}
              {computedPrice > 0 && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    {/* Price summary */}
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Стоимость поездки</p>
                        <p className="text-2xl font-extrabold text-gradient">{computedPrice.toLocaleString('ru-RU')} ₽</p>
                        <p className="text-xs text-muted-foreground">за весь автомобиль</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <Icon name="Receipt" className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Payment method */}
                    <p className="text-sm font-semibold">Способ оплаты</p>

                    {/* Cash */}
                    <button
                      type="button"
                      onClick={() => setOrderForm(f => ({ ...f, payment_type: 'cash' }))}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${orderForm.payment_type === 'cash' ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/40'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${orderForm.payment_type === 'cash' ? 'gradient-primary' : 'bg-muted'}`}>
                        <Icon name="Banknote" className={`h-5 w-5 ${orderForm.payment_type === 'cash' ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Наличными водителю</p>
                        <p className="text-xs text-muted-foreground">Оплата при посадке</p>
                      </div>
                      <span className="font-bold text-sm">{computedPrice.toLocaleString('ru-RU')} ₽</span>
                    </button>

                    {/* Online full */}
                    {paymentSettings.payment_provider && paymentSettings.payment_provider !== 'none' && (paymentSettings.allow_full_payment ?? true) && (
                      <button
                        type="button"
                        onClick={() => setOrderForm(f => ({ ...f, payment_type: 'online' }))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${orderForm.payment_type === 'online' ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/40'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${orderForm.payment_type === 'online' ? 'gradient-primary' : 'bg-muted'}`}>
                          <Icon name="CreditCard" className={`h-5 w-5 ${orderForm.payment_type === 'online' ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Картой через {paymentSettings.payment_provider === 'yookassa' ? 'ЮКассу' : 'Робокассу'}</p>
                          <p className="text-xs text-muted-foreground">Безопасная онлайн-оплата</p>
                        </div>
                        <span className="font-bold text-sm">{computedPrice.toLocaleString('ru-RU')} ₽</span>
                      </button>
                    )}

                    {/* Prepay */}
                    {paymentSettings.payment_provider && paymentSettings.payment_provider !== 'none' && (paymentSettings.allow_prepay ?? false) && (
                      <button
                        type="button"
                        onClick={() => setOrderForm(f => ({ ...f, payment_type: 'prepay' }))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${orderForm.payment_type === 'prepay' ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/40'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${orderForm.payment_type === 'prepay' ? 'gradient-primary' : 'bg-muted'}`}>
                          <Icon name="Percent" className={`h-5 w-5 ${orderForm.payment_type === 'prepay' ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Предоплата {paymentSettings.prepay_percent || 30}%</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(computedPrice * (paymentSettings.prepay_percent || 30) / 100).toLocaleString('ru-RU')} ₽ сейчас, остаток при посадке
                          </p>
                        </div>
                        <span className="font-bold text-sm">{Math.round(computedPrice * (paymentSettings.prepay_percent || 30) / 100).toLocaleString('ru-RU')} ₽</span>
                      </button>
                    )}

                    {/* Info */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                      <Icon name="ShieldCheck" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                      <span>
                        {orderForm.payment_type === 'cash'
                          ? 'Заказ будет создан, водитель свяжется с вами для подтверждения.'
                          : 'После оплаты вам будет назначен водитель. Контакты появятся в разделе «Мои заказы».'}
                      </span>
                    </div>

                    <Button
                      className="w-full gradient-primary text-white min-h-[52px] font-semibold text-base"
                      onClick={handleCreateOrder}
                      disabled={orderLoading || !orderForm.pickup_datetime}
                    >
                      {orderLoading ? (
                        <><Icon name="Loader2" className="h-5 w-5 animate-spin mr-2" />Создаём заказ...</>
                      ) : orderForm.payment_type === 'cash' ? (
                        <><Icon name="Car" className="h-5 w-5 mr-2" />Заказать · {computedPrice.toLocaleString('ru-RU')} ₽</>
                      ) : (
                        <><Icon name="CreditCard" className="h-5 w-5 mr-2" />Оплатить и заказать · {computedPrice.toLocaleString('ru-RU')} ₽</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {computedPrice === 0 && (
                <Button
                  className="w-full gradient-primary text-white min-h-[52px] font-semibold text-base"
                  onClick={handleCreateOrder}
                  disabled={orderLoading || !orderForm.pickup_datetime || !orderForm.from_location}
                >
                  {orderLoading ? (
                    <><Icon name="Loader2" className="h-5 w-5 animate-spin mr-2" />Создаём заказ...</>
                  ) : (
                    <><Icon name="Car" className="h-5 w-5 mr-2" />Отправить заявку</>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ══ BALANCE TAB ══ */}
          <TabsContent value="balance" className="mt-0">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Баланс счёта</p>
                      <p className="text-4xl font-bold text-gradient">{fmt(balance, 2)} ₽</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Icon name="Wallet" className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 gradient-primary text-white min-h-[48px]">
                          <Icon name="Plus" className="mr-2 h-4 w-4" />Пополнить
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-3 rounded-2xl max-w-sm">
                        <DialogHeader><DialogTitle>Пополнить баланс</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-1">
                          <div>
                            <Label className="text-sm mb-1.5 block">Сумма (₽)</Label>
                            <Input type="number" placeholder="1000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="h-11" />
                          </div>
                          <div>
                            <Label className="text-sm mb-1.5 block">Способ оплаты</Label>
                            <select className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm" value={depositMethod} onChange={e => setDepositMethod(e.target.value)}>
                              <option value="">Выберите...</option>
                              <option value="card">Банковская карта</option>
                              <option value="sbp">СБП</option>
                              <option value="cash">Наличные</option>
                            </select>
                          </div>
                          <Button className="w-full gradient-primary text-white min-h-[48px]" onClick={submitDeposit}>Пополнить</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 min-h-[48px]">
                          <Icon name="ArrowDown" className="mr-2 h-4 w-4" />Вывести
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-3 rounded-2xl max-w-sm">
                        <DialogHeader><DialogTitle>Вывести средства</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-1">
                          <div>
                            <Label className="text-sm mb-1.5 block">Сумма (₽)</Label>
                            <Input type="number" placeholder="1000" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="h-11" />
                          </div>
                          <div>
                            <Label className="text-sm mb-1.5 block">Реквизиты (карта / СБП)</Label>
                            <Textarea placeholder="Номер карты или телефон для СБП..." value={withdrawRequisites} onChange={e => setWithdrawRequisites(e.target.value)} rows={3} />
                          </div>
                          <Button className="w-full gradient-primary text-white min-h-[48px]" onClick={submitWithdraw}>Вывести</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">История операций</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">Операций пока нет</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-3 min-h-[52px]">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <p className="text-xs text-muted-foreground">{fmtDateShort(t.created_at)}</p>
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

          {/* ══ PROFILE TAB ══ */}
          <TabsContent value="profile" className="mt-0">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-5 p-3 bg-muted/40 rounded-xl">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg leading-tight">{userName}</p>
                      <p className="text-sm text-muted-foreground">Пассажир</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
                      </p>
                    </div>
                  </div>

                  {/* Push */}
                  {pushSupported && pushState !== 'unsupported' && (
                    <div className="p-3.5 border border-border rounded-xl mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon name="Bell" className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">Push-уведомления</p>
                            <p className="text-xs text-muted-foreground">Статус заказов на телефон</p>
                          </div>
                        </div>
                        <Badge variant={pushState === 'granted' ? 'default' : pushState === 'denied' ? 'destructive' : 'outline'} className="text-xs">
                          {pushState === 'granted' ? 'Включены' : pushState === 'denied' ? 'Заблокированы' : 'Выключены'}
                        </Badge>
                      </div>
                      {pushState === 'granted' ? (
                        <Button variant="outline" size="sm" className="w-full min-h-[40px] text-xs" onClick={async () => { setPushLoading(true); await pushUnsubscribe(); setPushLoading(false); }} disabled={pushLoading}>
                          {pushLoading ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1.5" /> : <Icon name="BellOff" className="h-3 w-3 mr-1.5" />}
                          Отключить уведомления
                        </Button>
                      ) : pushState === 'denied' ? (
                        <p className="text-xs text-muted-foreground">Разрешите уведомления в настройках браузера</p>
                      ) : (
                        <Button size="sm" className="w-full gradient-primary text-white min-h-[40px] text-xs" onClick={async () => { setPushLoading(true); await pushSubscribe(); setPushLoading(false); }} disabled={pushLoading}>
                          {pushLoading ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1.5" /> : <Icon name="Bell" className="h-3 w-3 mr-1.5" />}
                          Включить уведомления
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full min-h-[48px] justify-start" onClick={() => navigate('/')}>
                      <Icon name="Home" className="mr-2 h-4 w-4" />На главную
                    </Button>
                    <Button variant="outline" className="w-full min-h-[48px] justify-start" onClick={() => navigate('/driver/register')}>
                      <Icon name="Car" className="mr-2 h-4 w-4" />Стать водителем
                    </Button>
                    <Button variant="destructive" className="w-full min-h-[48px]" onClick={handleLogout}>
                      <Icon name="LogOut" className="mr-2 h-4 w-4" />Выйти из аккаунта
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={v => { if (!v) { setReviewDialogOpen(false); setReviewOrder(null); } }}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Отзыв о водителе</DialogTitle>
            {reviewOrder?.driver_name && <p className="text-sm text-muted-foreground">{reviewOrder.driver_name}</p>}
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <Label className="text-sm mb-2 block">Оценка</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)} className={`text-3xl transition-transform hover:scale-110 active:scale-95 ${n <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`} aria-label={`${n} звезд`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Комментарий</Label>
              <Textarea placeholder="Расскажите о поездке..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
            </div>
            <Button className="w-full gradient-primary text-white min-h-[48px]" onClick={submitReview} disabled={reviewSubmitting || !reviewText.trim()}>
              {reviewSubmitting ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : <Icon name="Send" className="h-4 w-4 mr-2" />}
              Отправить отзыв
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
