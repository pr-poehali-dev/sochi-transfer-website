import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rideshare {
  id: number;
  route_from: string;
  route_to: string;
  departure_datetime: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  car_class: string;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  status: string;
  created_by_name?: string;
}

interface Booking {
  id: number;
  rideshare_id: number;
  passenger_name: string;
  passenger_phone: string;
  seats_count: number;
  status: string;
  cancel_token?: string;
  created_at: string;
  route_from?: string;
  route_to?: string;
  departure_datetime?: string;
  price_per_seat?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_CLASS_LABELS: Record<string, string> = {
  economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн',
};

const STORAGE_KEY_ID    = 'passenger_user_id';
const STORAGE_KEY_NAME  = 'passenger_user_name';
const STORAGE_KEY_PHONE = 'passenger_user_phone';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dt: string) =>
  new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const formatDateShort = (dt: string) =>
  new Date(dt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

const nowDatetimeLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const statusLabel = (s: string) =>
  s === 'confirmed' ? 'Подтверждено' : s === 'cancelled' ? 'Отменено' : 'Ожидание';

const statusVariant = (s: string): 'default' | 'destructive' | 'secondary' =>
  s === 'confirmed' ? 'default' : s === 'cancelled' ? 'destructive' : 'secondary';

// ─── RoutePin visual ──────────────────────────────────────────────────────────

const RoutePin = ({ from, to }: { from: string; to: string }) => (
  <div className="flex items-start gap-2.5">
    <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <div className="w-px h-5 bg-muted-foreground/25 my-0.5" />
      <div className="w-2 h-2 rounded-full bg-red-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-tight truncate">{from}</p>
      <p className="text-sm text-muted-foreground leading-tight truncate mt-2">{to}</p>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const PassengerCabinet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAuth, setIsAuth]         = useState(false);
  const [authMode, setAuthMode]     = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm]     = useState({ name: '', phone: '', password: '', password2: '' });
  const [authLoading, setAuthLoading] = useState(false);

  const [rides, setRides]           = useState<Rideshare[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(false);

  const [createDialog, setCreateDialog] = useState(false);
  const [bookDialog, setBookDialog]     = useState(false);
  const [selectedRide, setSelectedRide] = useState<Rideshare | null>(null);

  const [createForm, setCreateForm] = useState({
    route_from: '', route_to: '', departure_datetime: '',
    seats_total: '4', price_per_seat: '', car_class: 'comfort', notes: '',
  });
  const [bookForm, setBookForm] = useState({ seats_count: '1' });

  const userId    = localStorage.getItem(STORAGE_KEY_ID);
  const userName  = localStorage.getItem(STORAGE_KEY_NAME)  || '';
  const userPhone = localStorage.getItem(STORAGE_KEY_PHONE) || '';

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEY_ID);
    if (uid) { setIsAuth(true); loadData(); }
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await fetch(API_URLS.rideshares);
      const d = await r.json();
      setRides((d.rideshares || []).filter((rs: Rideshare) => rs.status === 'active'));
    } catch (e) { console.error('[PassengerCabinet] loadData rides error:', e); }

    const uid = localStorage.getItem(STORAGE_KEY_ID);
    if (uid) {
      try {
        const r = await fetch(`${API_URLS.rideshares}&action=my_bookings&user_id=${uid}`);
        const d = await r.json();
        setMyBookings(d.bookings || []);
      } catch (e) { console.error('[PassengerCabinet] loadData bookings error:', e); }
    }
    setLoading(false);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleAuth = async () => {
    if (!authForm.phone || !authForm.password) {
      toast({ title: 'Введите телефон и пароль', variant: 'destructive' }); return;
    }
    if (authMode === 'register') {
      if (!authForm.name) { toast({ title: 'Введите имя', variant: 'destructive' }); return; }
      if (authForm.password.length < 6) { toast({ title: 'Пароль минимум 6 символов', variant: 'destructive' }); return; }
      if (authForm.password !== authForm.password2) { toast({ title: 'Пароли не совпадают', variant: 'destructive' }); return; }
    }
    setAuthLoading(true);
    try {
      const r = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode === 'login' ? 'login' : 'register',
          phone: authForm.phone,
          name: authForm.name,
          password: authForm.password,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка');
      const user = data.user;
      localStorage.setItem(STORAGE_KEY_ID,    String(user.id));
      localStorage.setItem(STORAGE_KEY_NAME,  user.name);
      localStorage.setItem(STORAGE_KEY_PHONE, user.phone);
      setIsAuth(true);
      toast({ title: authMode === 'login' ? 'Добро пожаловать!' : 'Аккаунт создан!' });
      loadData();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
    setAuthLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_PHONE);
    setIsAuth(false);
    setRides([]);
    setMyBookings([]);
  };

  // ── Ride actions ──────────────────────────────────────────────────────────

  const createRide = async () => {
    if (!createForm.route_from || !createForm.route_to || !createForm.departure_datetime) {
      toast({ title: 'Заполните маршрут и дату', variant: 'destructive' }); return;
    }
    try {
      const r = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          seats_total: parseInt(createForm.seats_total),
          price_per_seat: parseFloat(createForm.price_per_seat || '0'),
          created_by_name: userName,
          created_by_phone: userPhone,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Поездка создана!' });
      setCreateDialog(false);
      setCreateForm({ route_from: '', route_to: '', departure_datetime: '', seats_total: '4', price_per_seat: '', car_class: 'comfort', notes: '' });
      loadData();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
  };

  const bookRide = async () => {
    if (!selectedRide) return;
    const seats = parseInt(bookForm.seats_count);
    if (seats < 1 || seats > selectedRide.seats_available) {
      toast({ title: 'Неверное количество мест', variant: 'destructive' }); return;
    }
    try {
      const r = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          rideshare_id: selectedRide.id,
          passenger_name: userName,
          passenger_phone: userPhone,
          seats_count: seats,
          user_id: userId ? parseInt(userId) : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Место забронировано!' });
      setBookDialog(false);
      setSelectedRide(null);
      loadData();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
  };

  const cancelBooking = async (cancelToken: string) => {
    if (!confirm('Отменить бронирование?')) return;
    try {
      const r = await fetch(`${API_URLS.rideshares}&cancel_token=${cancelToken}`);
      const d = await r.json();
      toast({ title: d.cancelled ? 'Бронирование отменено' : (d.message || 'Готово') });
      loadData();
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  // ── Auth screen ───────────────────────────────────────────────────────────

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
        {/* Mini header */}
        <header className="h-14 flex items-center px-4 border-b bg-background/80 backdrop-blur-md">
          <button
            className="flex items-center gap-2 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Users" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Попутчики</span>
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <Icon name="Users" className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">
                {authMode === 'login' ? 'Войти в кабинет' : 'Создать аккаунт'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {authMode === 'login' ? 'Для доступа к поездкам попутчиков' : 'Присоединитесь к сервису попутчиков'}
              </p>
            </div>

            <Card className="border border-border shadow-lg">
              <CardContent className="p-5 space-y-3">
                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Ваше имя</Label>
                    <Input
                      className="h-11"
                      placeholder="Иван Иванов"
                      autoComplete="name"
                      value={authForm.name}
                      onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm">Телефон</Label>
                  <Input
                    className="h-11"
                    type="tel"
                    inputMode="tel"
                    placeholder="+7 (900) 000-00-00"
                    autoComplete="tel"
                    value={authForm.phone}
                    onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Пароль</Label>
                  <Input
                    className="h-11"
                    type="password"
                    placeholder="Минимум 6 символов"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    value={authForm.password}
                    onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  />
                </div>
                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Повторите пароль</Label>
                    <Input
                      className={`h-11 ${authForm.password2 && authForm.password !== authForm.password2 ? 'border-red-400' : ''}`}
                      type="password"
                      placeholder="Повторите пароль"
                      autoComplete="new-password"
                      value={authForm.password2}
                      onChange={e => setAuthForm(f => ({ ...f, password2: e.target.value }))}
                    />
                    {authForm.password2 && authForm.password !== authForm.password2 && (
                      <p className="text-xs text-red-500">Пароли не совпадают</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full gradient-primary text-white min-h-[48px] text-base font-semibold mt-1"
                  onClick={handleAuth}
                  disabled={authLoading}
                >
                  {authLoading && <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />}
                  {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-1">
                  {authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                  <button
                    className="text-primary font-medium underline-offset-2 hover:underline"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  >
                    {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground min-h-[40px]"
                  onClick={() => navigate('/')}
                >
                  <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
                  На главную
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated view ────────────────────────────────────────────────────

  const activeBookings   = myBookings.filter(b => b.status !== 'cancelled');
  const bookSeats        = parseInt(bookForm.seats_count) || 1;
  const bookTotal        = selectedRide ? selectedRide.price_per_seat * bookSeats : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Users" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient hidden xs:inline">Попутчики</span>
          </button>

          <div className="flex items-center gap-2">
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName.charAt(0) || '?'}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[100px]">
              {userName}
            </span>
            <button
              onClick={logout}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Выйти"
            >
              <Icon name="LogOut" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <main className="max-w-2xl mx-auto px-3 pt-4 pb-24">

        <Tabs defaultValue="find">
          {/* Horizontally scrollable tab strip */}
          <div className="overflow-x-auto -mx-3 px-3 mb-4">
            <TabsList className="inline-flex w-max h-10 bg-muted rounded-xl p-1 gap-0">
              <TabsTrigger
                value="find"
                className="relative text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Поездки
                {rides.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted-foreground/20 text-foreground px-1.5 rounded-full">
                    {rides.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="relative text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                Мои записи
                {activeBookings.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-semibold">
                    {activeBookings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══════════════════════════════════════
              TAB: Find a ride
          ══════════════════════════════════════ */}
          <TabsContent value="find" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rides.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Icon name="Car" className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-muted-foreground">Нет доступных поездок</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">Предложите свою поездку первым!</p>
                  <Button
                    className="gradient-primary text-white min-h-[44px]"
                    onClick={() => setCreateDialog(true)}
                  >
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    Предложить поездку
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rides.map(ride => {
                  const isFull = ride.seats_available === 0;
                  return (
                    <Card
                      key={ride.id}
                      className={`border transition-shadow ${isFull ? 'opacity-70 border-border' : 'border-border hover:shadow-md'}`}
                    >
                      <CardContent className="p-4">
                        {/* Route */}
                        <RoutePin from={ride.route_from} to={ride.route_to} />

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                            <Icon name="Calendar" className="h-3 w-3" />
                            {formatDate(ride.departure_datetime)}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'}`}>
                            <Icon name="Users" className="h-3 w-3" />
                            {isFull ? 'Мест нет' : `${ride.seats_available} мест`}
                          </span>
                          <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                            <Icon name="Car" className="h-3 w-3" />
                            {CAR_CLASS_LABELS[ride.car_class] || ride.car_class}
                          </span>
                          {ride.created_by_name && (
                            <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full truncate max-w-[120px]">
                              <Icon name="User" className="h-3 w-3 flex-shrink-0" />
                              {ride.created_by_name}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {ride.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mt-3 italic">
                            {ride.notes}
                          </p>
                        )}

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <div>
                            <span className="font-bold text-primary text-lg leading-none">
                              {ride.price_per_seat > 0 ? `${ride.price_per_seat} ₽` : 'Договорная'}
                            </span>
                            {ride.price_per_seat > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">/чел</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="gradient-primary text-white min-h-[40px] px-5"
                            disabled={isFull}
                            onClick={() => { setSelectedRide(ride); setBookForm({ seats_count: '1' }); setBookDialog(true); }}
                          >
                            {isFull ? 'Мест нет' : 'Забронировать'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════
              TAB: My bookings
          ══════════════════════════════════════ */}
          <TabsContent value="bookings" className="mt-0">
            {myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Icon name="Ticket" className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-muted-foreground">Бронирований пока нет</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">Найдите поездку и займите место</p>
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => {
                      const tab = document.querySelector('[data-value="find"]') as HTMLButtonElement;
                      tab?.click();
                    }}
                  >
                    Найти поездку
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <Card key={b.id} className={b.status === 'cancelled' ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      {/* Route */}
                      {b.route_from && b.route_to ? (
                        <RoutePin from={b.route_from} to={b.route_to} />
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">Поездка #{b.rideshare_id}</p>
                      )}

                      {/* Date + status row */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {b.departure_datetime && (
                            <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                              <Icon name="Calendar" className="h-3 w-3" />
                              {formatDateShort(b.departure_datetime)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                            <Icon name="Users" className="h-3 w-3" />
                            {b.seats_count} мест
                          </span>
                          {b.price_per_seat && b.price_per_seat > 0 && (
                            <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full font-semibold text-foreground">
                              {b.price_per_seat * b.seats_count} ₽
                            </span>
                          )}
                        </div>
                        <Badge variant={statusVariant(b.status)} className="text-xs flex-shrink-0 ml-2">
                          {statusLabel(b.status)}
                        </Badge>
                      </div>

                      {/* Cancel */}
                      {b.cancel_token && b.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full min-h-[40px] text-xs text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20"
                          onClick={() => cancelBooking(b.cancel_token!)}
                        >
                          <Icon name="X" className="h-3.5 w-3.5 mr-1.5" />
                          Отменить бронирование
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── FAB: propose ride ── */}
      <button
        onClick={() => setCreateDialog(true)}
        className="fixed bottom-6 right-4 md:right-6 z-50 h-14 px-5 rounded-full gradient-primary text-white shadow-lg flex items-center gap-2 font-semibold hover:scale-105 active:scale-95 transition-transform"
        aria-label="Предложить поездку"
      >
        <Icon name="Plus" className="h-5 w-5" />
        <span className="hidden sm:inline">Предложить поездку</span>
      </button>

      {/* ════════════════════════════════════════════════
          DIALOG: Create ride
      ════════════════════════════════════════════════ */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предложить поездку</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* From */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="MapPin" className="inline h-3.5 w-3.5 mr-1 text-green-500" />
                Откуда
              </Label>
              <Input
                className="h-11"
                placeholder="Сочи, аэропорт"
                value={createForm.route_from}
                onChange={e => setCreateForm(f => ({ ...f, route_from: e.target.value }))}
              />
            </div>
            {/* To */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="Navigation" className="inline h-3.5 w-3.5 mr-1 text-red-500" />
                Куда
              </Label>
              <Input
                className="h-11"
                placeholder="Гагра, Пицунда, Сухум..."
                value={createForm.route_to}
                onChange={e => setCreateForm(f => ({ ...f, route_to: e.target.value }))}
              />
            </div>
            {/* Datetime */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="Calendar" className="inline h-3.5 w-3.5 mr-1 text-primary" />
                Дата и время
              </Label>
              <Input
                className="h-11"
                type="datetime-local"
                min={nowDatetimeLocal()}
                value={createForm.departure_datetime}
                onChange={e => setCreateForm(f => ({ ...f, departure_datetime: e.target.value }))}
              />
            </div>
            {/* Seats + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Свободных мест</Label>
                <Input
                  className="h-11"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="8"
                  value={createForm.seats_total}
                  onChange={e => setCreateForm(f => ({ ...f, seats_total: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Цена/чел (₽)</Label>
                <Input
                  className="h-11"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0 = договорная"
                  value={createForm.price_per_seat}
                  onChange={e => setCreateForm(f => ({ ...f, price_per_seat: e.target.value }))}
                />
              </div>
            </div>
            {/* Car class */}
            <div className="space-y-1.5">
              <Label className="text-sm">Класс автомобиля</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CAR_CLASS_LABELS).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCreateForm(f => ({ ...f, car_class: v }))}
                    className={`text-sm py-2.5 px-3 rounded-xl border-2 transition-colors font-medium ${
                      createForm.car_class === v
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm">Комментарий <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
              <Textarea
                placeholder="Дополнительная информация для пассажиров..."
                rows={2}
                value={createForm.notes}
                onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              className="w-full gradient-primary text-white min-h-[48px] text-base font-semibold"
              onClick={createRide}
            >
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать поездку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          DIALOG: Book a seat
      ════════════════════════════════════════════════ */}
      <Dialog open={bookDialog} onOpenChange={v => { setBookDialog(v); if (!v) setSelectedRide(null); }}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Забронировать место</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4 pt-1">
              {/* Ride summary */}
              <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                <RoutePin from={selectedRide.route_from} to={selectedRide.route_to} />
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" className="h-3 w-3" />
                    {formatDate(selectedRide.departure_datetime)}
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Icon name="Users" className="h-3 w-3" />
                    {selectedRide.seats_available} мест доступно
                  </span>
                </div>
              </div>

              {/* Seat count stepper */}
              <div className="space-y-1.5">
                <Label className="text-sm">Количество мест</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBookForm(f => ({ seats_count: String(Math.max(1, parseInt(f.seats_count) - 1)) }))}
                    disabled={bookSeats <= 1}
                    className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary transition-colors disabled:opacity-30"
                  >
                    <Icon name="Minus" className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold">{bookSeats}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookForm(f => ({ seats_count: String(Math.min(selectedRide.seats_available, parseInt(f.seats_count) + 1)) }))}
                    disabled={bookSeats >= selectedRide.seats_available}
                    className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary transition-colors disabled:opacity-30"
                  >
                    <Icon name="Plus" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Total */}
              {selectedRide.price_per_seat > 0 && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium">Итого</span>
                  <span className="text-xl font-bold text-primary">{bookTotal} ₽</span>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                <Icon name="Info" className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Ваши контакты будут переданы организатору поездки для подтверждения.</span>
              </div>

              <Button
                className="w-full gradient-primary text-white min-h-[48px] text-base font-semibold"
                onClick={bookRide}
              >
                <Icon name="CheckCircle2" className="mr-2 h-5 w-5" />
                Подтвердить бронирование
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassengerCabinet;
