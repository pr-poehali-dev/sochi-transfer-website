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
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 0) => Number(n || 0).toFixed(dec);

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('ru', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });

const transferTypeLabel = (v: string) =>
  ({ individual: 'Индивидуальный', group: 'Групповой' }[v] ?? v);

const carClassLabel = (v: string) =>
  ({ economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' }[v] ?? v);

const statusBg = (color: string) => {
  const map: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
    '#F59E0B': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    '#EF4444': 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    '#8B5CF6': 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    '#F97316': 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    '#6B7280': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return map[color] ?? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
};

// ─── Driver info card ─────────────────────────────────────────────────────────

const DriverCard = ({ order }: { order: Order }) => {
  if (!order.driver_name) return null;

  const initials = order.driver_name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const carLine = [order.car_brand, order.car_model, order.car_color]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/25 p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
          Ваш водитель назначен
        </span>
      </div>

      {/* Driver row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight">{order.driver_name}</p>

          {/* Rating */}
          {order.driver_rating && order.driver_rating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(order.driver_rating!)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {Number(order.driver_rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Call button */}
        {order.driver_phone && (
          <a
            href={`tel:${order.driver_phone}`}
            className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label={`Позвонить ${order.driver_name}`}
          >
            <Icon name="Phone" className="h-5 w-5 text-white" />
          </a>
        )}
      </div>

      {/* Car info */}
      <div className="mt-3 flex flex-wrap gap-2">
        {carLine && (
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-white/10 rounded-lg px-2.5 py-1.5">
            <Icon name="Car" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-medium">{carLine}</span>
          </div>
        )}
        {order.car_number && (
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-white/10 rounded-lg px-2.5 py-1.5">
            <Icon name="Hash" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest">{order.car_number}</span>
          </div>
        )}
        {order.driver_phone && (
          <a
            href={`tel:${order.driver_phone}`}
            className="flex items-center gap-1.5 bg-white/70 dark:bg-white/10 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Icon name="Phone" className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {order.driver_phone}
            </span>
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Order card (collapsed + expandable) ─────────────────────────────────────

const OrderCard = ({
  order,
  onReview,
}: {
  order: Order;
  onReview: (orderId: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasDriver = !!order.driver_name;
  const isCompleted = order.status_name === 'Выполнен';

  return (
    <Card
      className={`border transition-shadow ${
        hasDriver && !isCompleted
          ? 'border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-950/20'
          : 'border-border'
      } ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}
    >
      {/* ── Collapsed summary row ── */}
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Left: order number + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">#{order.id}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBg(order.status_color)}`}
                >
                  {order.status_name}
                </span>
                {hasDriver && !isCompleted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Водитель едет
                  </span>
                )}
              </div>

              {/* Route */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-start gap-1.5">
                  <Icon name="MapPin" className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{order.from_location}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Icon name="Navigation" className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="truncate font-medium text-foreground">{order.to_location}</span>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Icon name="Calendar" className="h-3 w-3 flex-shrink-0" />
                {fmtDate(order.pickup_datetime)}
              </p>
            </div>

            {/* Right: price + expand chevron */}
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
              <span className="text-lg font-bold text-gradient leading-none">
                {fmt(order.price)} ₽
              </span>
              <span className="text-[10px] text-muted-foreground">
                {carClassLabel(order.car_class)}
              </span>
              <Icon
                name="ChevronDown"
                className={`h-4 w-4 text-muted-foreground mt-1 transition-transform duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </CardContent>
      </button>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          {/* Additional meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-0.5">Тип</p>
              <p className="font-medium">{transferTypeLabel(order.transfer_type)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-0.5">Класс</p>
              <p className="font-medium">{carClassLabel(order.car_class)}</p>
            </div>
          </div>

          {/* Driver info — prominent when assigned */}
          {hasDriver ? (
            <DriverCard order={order} />
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
              <Icon name="Clock" className="h-4 w-4 flex-shrink-0" />
              <span>Водитель будет назначен после подтверждения заявки</span>
            </div>
          )}

          {/* Review button */}
          {hasDriver && isCompleted && (
            <Button
              size="sm"
              variant="outline"
              className="w-full min-h-[44px] border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/30"
              onClick={() => onReview(order.id)}
            >
              <Icon name="Star" className="mr-2 h-4 w-4 text-yellow-500" />
              Оставить отзыв о водителе
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Review dialog ────────────────────────────────────────────────────────────

const ReviewDialog = ({
  order,
  open,
  onClose,
  onSubmit,
  rating,
  setRating,
  text,
  setText,
  submitting,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  rating: number;
  setRating: (n: number) => void;
  text: string;
  setText: (s: string) => void;
  submitting: boolean;
}) => (
  <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
    <DialogContent className="mx-3 rounded-2xl max-w-sm">
      <DialogHeader>
        <DialogTitle>Отзыв о водителе</DialogTitle>
        {order?.driver_name && (
          <p className="text-sm text-muted-foreground">{order.driver_name}</p>
        )}
      </DialogHeader>
      <div className="space-y-4 pt-1">
        <div>
          <Label className="text-sm mb-2 block">Оценка</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-3xl transition-transform hover:scale-110 active:scale-95 ${
                  n <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                }`}
                aria-label={`${n} звезд`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-sm mb-2 block">Комментарий</Label>
          <Textarea
            placeholder="Расскажите о поездке..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
          />
        </div>
        <Button
          className="w-full gradient-primary text-white min-h-[48px]"
          onClick={onSubmit}
          disabled={submitting || !text.trim()}
        >
          {submitting ? (
            <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Icon name="Send" className="h-4 w-4 mr-2" />
          )}
          Отправить отзыв
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Review state
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Balance dialogs
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRequisites, setWithdrawRequisites] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);

  // Push notifications
  const {
    state: pushState,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    isSupported: pushSupported,
  } = usePushNotifications();
  const [pushLoading, setPushLoading] = useState(false);

  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name') || 'Пользователь';

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) { navigate('/auth'); return; }
    loadOrders();
    loadBalance();
  }, [userId]);

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
    } catch (e) { console.error('[UserProfile] loadBalance profile error:', e); }
    try {
      const r2 = await fetch(`${API_URLS.balance}&action=transactions&user_id=${userId}`);
      const data2 = await r2.json();
      setTransactions(data2.transactions || []);
    } catch (e) { console.error('[UserProfile] loadBalance transactions error:', e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    navigate('/');
  };

  // ── Review ───────────────────────────────────────────────────────────────────

  const openReview = (orderId: number) => {
    const order = orders.find(o => o.id === orderId) ?? null;
    setReviewOrder(order);
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
        body: JSON.stringify({
          user_id: Number(userId),
          driver_id: null,
          order_id: reviewOrder?.id ?? null,
          author_name: userName,
          rating: reviewRating,
          text: reviewText,
          type: 'driver',
        }),
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

  // ── Balance actions ───────────────────────────────────────────────────────────

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawRequisites) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          amount: parseFloat(withdrawAmount),
          requisites: withdrawRequisites,
          user_id: userId,
        }),
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
        body: JSON.stringify({
          action: 'deposit',
          amount: parseFloat(depositAmount),
          payment_method: depositMethod,
          user_id: userId,
        }),
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на пополнение создана', description: 'Ожидайте подтверждения администратора' });
      setDepositOpen(false);
      setDepositAmount('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeOrders = orders.filter(o => o.driver_name && o.status_name !== 'Выполнен' && o.status_name !== 'Отменён');
  const ordersWithDriver = orders.filter(o => o.driver_name);

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* ── Sticky header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient hidden xs:inline">ПоехалиПро</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0)}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[120px]">
              {userName}
            </span>
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
      <main className="pt-14 pb-10 px-3 max-w-2xl mx-auto">

        {/* ── Active ride banner (driver en-route) ── */}
        {activeOrders.length > 0 && (
          <div className="mt-4 mb-3">
            {activeOrders.map(order => (
              <div
                key={order.id}
                className="rounded-xl border-2 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Icon name="Car" className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-800 dark:text-green-300 text-sm leading-tight">
                    Водитель назначен — {order.driver_name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">
                    {order.from_location} → {order.to_location}
                  </p>
                </div>
                {order.driver_phone && (
                  <a
                    href={`tel:${order.driver_phone}`}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Icon name="Phone" className="h-4 w-4 text-white" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Page title ── */}
        <div className="mt-4 mb-4">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-muted-foreground text-sm">{userName}</p>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="orders">
          {/* Horizontally scrollable tab list */}
          <div className="overflow-x-auto -mx-3 px-3 mb-4">
            <TabsList className="inline-flex w-max gap-0 h-10 bg-muted rounded-xl p-1">
              <TabsTrigger
                value="orders"
                className="relative text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Мои заказы
                {orders.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted-foreground/20 text-foreground px-1.5 rounded-full">
                    {orders.length}
                  </span>
                )}
                {ordersWithDriver.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="balance"
                className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Баланс
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="text-xs px-3 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Профиль
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══════════════════════════════════════
              ORDERS TAB
          ══════════════════════════════════════ */}
          <TabsContent value="orders" className="mt-0">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <Icon name="PackageSearch" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium mb-4">У вас ещё нет заказов</p>
                  <Button
                    className="gradient-primary text-white min-h-[44px]"
                    onClick={() => navigate('/')}
                  >
                    Заказать трансфер
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} onReview={openReview} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════
              BALANCE TAB
          ══════════════════════════════════════ */}
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
                    {/* Deposit dialog */}
                    <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 gradient-primary text-white min-h-[48px]">
                          <Icon name="Plus" className="mr-2 h-4 w-4" />Пополнить
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-3 rounded-2xl max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Пополнение баланса</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-1">
                          <div>
                            <Label className="text-sm mb-1.5 block">Сумма (₽)</Label>
                            <Input
                              type="number"
                              placeholder="1000"
                              value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)}
                              className="h-11"
                            />
                          </div>
                          <div>
                            <Label className="text-sm mb-1.5 block">Способ оплаты</Label>
                            <select
                              className="w-full h-11 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              value={depositMethod}
                              onChange={e => setDepositMethod(e.target.value)}
                            >
                              <option value="">Выберите способ</option>
                              <option value="card">Банковская карта</option>
                              <option value="sbp">СБП</option>
                              <option value="cash">Наличные</option>
                            </select>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Администратор свяжется с вами для подтверждения платежа.
                          </p>
                          <Button
                            className="w-full gradient-primary text-white min-h-[48px]"
                            onClick={submitDeposit}
                          >
                            Отправить заявку
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Withdraw dialog */}
                    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 min-h-[48px]" variant="outline">
                          <Icon name="ArrowUpRight" className="mr-2 h-4 w-4" />Вывести
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-3 rounded-2xl max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Вывод средств</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-1">
                          <p className="text-sm text-muted-foreground">
                            Доступно: <strong className="text-foreground">{fmt(balance, 2)} ₽</strong>
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
                          <Button
                            className="w-full gradient-primary text-white min-h-[48px]"
                            onClick={submitWithdraw}
                          >
                            Вывести
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                        <div key={t.id} className="flex items-center justify-between py-3 min-h-[52px]">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDateShort(t.created_at)}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-semibold flex-shrink-0 ${
                              Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {Number(t.amount) >= 0 ? '+' : ''}
                            {Number(t.amount).toFixed(2)} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════
              PROFILE TAB
          ══════════════════════════════════════ */}
          <TabsContent value="profile" className="mt-0">
            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  {/* User info */}
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

                  {/* Push notifications */}
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
                        <Badge
                          variant={
                            pushState === 'granted'
                              ? 'default'
                              : pushState === 'denied'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {pushState === 'granted'
                            ? 'Включены'
                            : pushState === 'denied'
                            ? 'Заблокированы'
                            : 'Выключены'}
                        </Badge>
                      </div>

                      {pushState === 'granted' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full min-h-[40px] text-xs"
                          onClick={async () => {
                            setPushLoading(true);
                            await pushUnsubscribe();
                            setPushLoading(false);
                          }}
                          disabled={pushLoading}
                        >
                          {pushLoading
                            ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1.5" />
                            : <Icon name="BellOff" className="h-3 w-3 mr-1.5" />}
                          Отключить уведомления
                        </Button>
                      ) : pushState === 'denied' ? (
                        <p className="text-xs text-muted-foreground">
                          Разрешите уведомления в настройках браузера
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gradient-primary text-white min-h-[40px] text-xs"
                          onClick={async () => {
                            setPushLoading(true);
                            await pushSubscribe();
                            setPushLoading(false);
                          }}
                          disabled={pushLoading}
                        >
                          {pushLoading
                            ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1.5" />
                            : <Icon name="Bell" className="h-3 w-3 mr-1.5" />}
                          Включить уведомления
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full min-h-[48px] justify-start"
                      onClick={() => navigate('/')}
                    >
                      <Icon name="Home" className="mr-2 h-4 w-4" />
                      На главную
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full min-h-[48px] justify-start"
                      onClick={() => navigate('/driver/register')}
                    >
                      <Icon name="Car" className="mr-2 h-4 w-4" />
                      Стать водителем
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full min-h-[48px]"
                      onClick={handleLogout}
                    >
                      <Icon name="LogOut" className="mr-2 h-4 w-4" />
                      Выйти из аккаунта
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Review dialog (outside tabs) ── */}
      <ReviewDialog
        order={reviewOrder}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={submitReview}
        rating={reviewRating}
        setRating={setReviewRating}
        text={reviewText}
        setText={setReviewText}
        submitting={reviewSubmitting}
      />
    </div>
  );
};

export default UserProfile;
