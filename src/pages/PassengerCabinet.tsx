import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  created_by_phone?: string;
  created_by_user_id?: number;
  expires_at?: string;
  rideshare_driver_id?: number;
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
  economy: 'Эконом',
  comfort: 'Комфорт',
  business: 'Бизнес',
  minivan: 'Минивэн',
};

const STORAGE_KEYS = {
  id:    ['passenger_user_id', 'user_id'],
  name:  ['passenger_user_name', 'user_name'],
  phone: ['passenger_user_phone', 'user_phone'],
};

const PRIMARY_KEY_ID    = 'passenger_user_id';
const PRIMARY_KEY_NAME  = 'passenger_user_name';
const PRIMARY_KEY_PHONE = 'passenger_user_phone';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readStorage(keys: string[]): string {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return '';
}

function formatDatetime(dt?: string): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
}

function formatDate(dt?: string): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dt; }
}

function nowDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const BOOKING_STATUS: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  confirmed: { label: 'Подтверждено', variant: 'default' },
  cancelled:  { label: 'Отменено',     variant: 'destructive' },
  pending:    { label: 'Ожидание',     variant: 'secondary' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RoutePin = ({ from, to }: { from: string; to: string }) => (
  <div className="flex items-start gap-2.5">
    <div className="flex flex-col items-center pt-1 shrink-0">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <div className="w-px h-4 bg-muted-foreground/25 my-0.5" />
      <div className="w-2 h-2 rounded-full bg-red-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold leading-tight truncate">{from}</p>
      <p className="text-sm text-muted-foreground leading-tight truncate mt-[10px]">{to}</p>
    </div>
  </div>
);

// ─── Auth Screen ──────────────────────────────────────────────────────────────

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen = ({ onSuccess }: AuthScreenProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', phone: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.phone || !form.password) {
      toast({ title: 'Введите телефон и пароль', variant: 'destructive' }); return;
    }
    if (mode === 'register') {
      if (!form.name) { toast({ title: 'Введите имя', variant: 'destructive' }); return; }
      if (form.password.length < 6) { toast({ title: 'Пароль минимум 6 символов', variant: 'destructive' }); return; }
      if (form.password !== form.password2) { toast({ title: 'Пароли не совпадают', variant: 'destructive' }); return; }
    }
    setLoading(true);
    try {
      const res = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode === 'login' ? 'login' : 'register',
          phone: form.phone,
          name: form.name,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
      const user = data.user;
      localStorage.setItem(PRIMARY_KEY_ID,    String(user.id));
      localStorage.setItem(PRIMARY_KEY_NAME,  user.name || '');
      localStorage.setItem(PRIMARY_KEY_PHONE, user.phone || form.phone);
      toast({ title: mode === 'login' ? 'Добро пожаловать!' : 'Аккаунт создан!' });
      onSuccess();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      <header className="h-14 flex items-center px-4 border-b bg-background/80 backdrop-blur-md">
        <button
          className="flex items-center gap-2 min-h-[44px]"
          onClick={() => navigate('/')}
        >
          <Icon name="ArrowLeft" className="h-4 w-4 text-muted-foreground" />
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Icon name="Car" className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gradient">ПоехалиПро</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Icon name="Users" className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold">
              {mode === 'login' ? 'Войти в кабинет' : 'Создать аккаунт'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login'
                ? 'Чтобы создавать поездки и бронировать места'
                : 'Присоединяйтесь к сервису попутчиков'}
            </p>
          </div>

          <Card className="border shadow-lg">
            <CardContent className="p-5 space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Ваше имя</Label>
                  <Input
                    className="h-11"
                    placeholder="Иван Иванов"
                    autoComplete="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Пароль</Label>
                <Input
                  className="h-11"
                  type="password"
                  placeholder="Минимум 6 символов"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Повторите пароль</Label>
                  <Input
                    className={`h-11 ${form.password2 && form.password !== form.password2 ? 'border-red-400' : ''}`}
                    type="password"
                    placeholder="Повторите пароль"
                    autoComplete="new-password"
                    value={form.password2}
                    onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  {form.password2 && form.password !== form.password2 && (
                    <p className="text-xs text-red-500">Пароли не совпадают</p>
                  )}
                </div>
              )}

              <Button
                className="w-full gradient-primary text-white min-h-[48px] text-base font-semibold mt-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading && <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />}
                {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-1">
                {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <button
                  className="text-primary font-medium underline-offset-2 hover:underline"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Просматривать поездки можно и без авторизации.{' '}
                <button
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => navigate('/rideshares')}
                >
                  Смотреть поездки
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const PassengerCabinet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth state — read from localStorage on mount (support both key variants)
  const [userId,    setUserId]    = useState(() => readStorage(STORAGE_KEYS.id));
  const [userName,  setUserName]  = useState(() => readStorage(STORAGE_KEYS.name));
  const [userPhone, setUserPhone] = useState(() => readStorage(STORAGE_KEYS.phone));
  const isAuth = !!userId;

  // Data
  const [rides,      setRides]      = useState<Rideshare[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [bookDialog,   setBookDialog]   = useState(false);
  const [selectedRide, setSelectedRide] = useState<Rideshare | null>(null);
  const [cancelConfirmToken, setCancelConfirmToken] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Create ride form
  const [createForm, setCreateForm] = useState({
    route_from: '',
    route_to: '',
    departure_datetime: '',
    seats_total: '4',
    price_per_seat: '',
    car_class: 'comfort',
    expires_at: '',
    notes: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Book form
  const [bookSeats, setBookSeats] = useState(1);
  const [bookLoading, setBookLoading] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadRides = useCallback(async () => {
    try {
      const res = await fetch(API_URLS.rideshares);
      const data = await res.json();
      setRides(data.rideshares || []);
    } catch (err) {
      console.error('[PassengerCabinet] loadRides error:', err);
    }
  }, []);

  const loadBookings = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`${API_URLS.rideshares}&action=my_bookings&user_id=${uid}`);
      const data = await res.json();
      setMyBookings(data.bookings || []);
    } catch (err) {
      console.error('[PassengerCabinet] loadBookings error:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const uid = readStorage(STORAGE_KEYS.id);
    const promises: Promise<void>[] = [loadRides()];
    if (uid) promises.push(loadBookings(uid));
    await Promise.all(promises);
    setLoading(false);
  }, [loadRides, loadBookings]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const handleAuthSuccess = () => {
    const uid    = readStorage(STORAGE_KEYS.id);
    const uname  = readStorage(STORAGE_KEYS.name);
    const uphone = readStorage(STORAGE_KEYS.phone);
    setUserId(uid);
    setUserName(uname);
    setUserPhone(uphone);
    loadAll();
  };

  const logout = () => {
    for (const keys of Object.values(STORAGE_KEYS)) {
      keys.forEach(k => localStorage.removeItem(k));
    }
    setUserId('');
    setUserName('');
    setUserPhone('');
    setMyBookings([]);
  };

  // ── Create ride ───────────────────────────────────────────────────────────

  const handleCreateRide = async () => {
    if (!createForm.route_from || !createForm.route_to || !createForm.departure_datetime) {
      toast({ title: 'Заполните маршрут и дату отправления', variant: 'destructive' }); return;
    }
    if (!createForm.price_per_seat) {
      toast({ title: 'Укажите цену за место (0 если бесплатно)', variant: 'destructive' }); return;
    }
    setCreateLoading(true);
    try {
      const body: Record<string, unknown> = {
        action: 'create',
        route_from: createForm.route_from,
        route_to: createForm.route_to,
        departure_datetime: createForm.departure_datetime,
        seats_total: parseInt(createForm.seats_total),
        price_per_seat: parseFloat(createForm.price_per_seat || '0'),
        car_class: createForm.car_class,
        notes: createForm.notes,
        created_by_user_id: userId ? parseInt(userId) : undefined,
        created_by_name: userName || undefined,
        created_by_phone: userPhone || undefined,
      };
      if (createForm.expires_at) {
        body.expires_at = createForm.expires_at;
      }
      const res = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания поездки');
      toast({ title: 'Поездка создана!', description: 'Она появится в общем списке' });
      setCreateDialog(false);
      setCreateForm({ route_from: '', route_to: '', departure_datetime: '', seats_total: '4', price_per_seat: '', car_class: 'comfort', expires_at: '', notes: '' });
      loadRides();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Book a seat ───────────────────────────────────────────────────────────

  const openBookDialog = (ride: Rideshare) => {
    setSelectedRide(ride);
    setBookSeats(1);
    setBookDialog(true);
  };

  const handleBook = async () => {
    if (!selectedRide) return;
    if (bookSeats < 1 || bookSeats > selectedRide.seats_available) {
      toast({ title: 'Неверное количество мест', variant: 'destructive' }); return;
    }
    setBookLoading(true);
    try {
      const res = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          rideshare_id: selectedRide.id,
          passenger_name: userName || 'Пассажир',
          passenger_phone: userPhone || '',
          seats_count: bookSeats,
          user_id: userId ? parseInt(userId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка бронирования');
      toast({ title: 'Место забронировано!', description: 'Вы увидите его в "Мои бронирования"' });
      setBookDialog(false);
      setSelectedRide(null);
      await Promise.all([loadRides(), userId ? loadBookings(userId) : Promise.resolve()]);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setBookLoading(false);
    }
  };

  // ── Cancel booking ────────────────────────────────────────────────────────

  const handleCancelBooking = async () => {
    if (!cancelConfirmToken) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`${API_URLS.rideshares}&cancel_token=${cancelConfirmToken}`);
      const data = await res.json();
      toast({ title: data.cancelled ? 'Бронирование отменено' : (data.message || 'Готово') });
      setCancelConfirmToken(null);
      await Promise.all([loadRides(), userId ? loadBookings(userId) : Promise.resolve()]);
    } catch {
      toast({ title: 'Ошибка при отмене', variant: 'destructive' });
    } finally {
      setCancelLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // If not logged in — auth is required only to act; public ride list is shown
  // Auth guard for creating rides is inline (button not shown if !isAuth)
  // For "My bookings" tab, redirect to auth if needed
  // ─────────────────────────────────────────────────────────────────────────

  const activeBookings = myBookings.filter(b => b.status !== 'cancelled');
  const bookTotal = selectedRide ? selectedRide.price_per_seat * bookSeats : 0;

  // Show full auth screen when user explicitly needs to log in
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  if (showAuthScreen && !isAuth) {
    return <AuthScreen onSuccess={() => { handleAuthSuccess(); setShowAuthScreen(false); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <button
            className="flex items-center gap-2 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <Icon name="ArrowLeft" className="h-4 w-4 text-muted-foreground" />
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient hidden sm:inline">ПоехалиПро</span>
          </button>

          <div className="flex items-center gap-2">
            {isAuth ? (
              <>
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(userName || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[120px]">
                  {userName}
                </span>
                <button
                  onClick={logout}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Выйти"
                >
                  <Icon name="LogOut" className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="min-h-[36px] text-xs"
                onClick={() => setShowAuthScreen(true)}
              >
                <Icon name="LogIn" className="h-3.5 w-3.5 mr-1" />
                Войти
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-2xl mx-auto px-3 pt-4 pb-28">

        <Tabs defaultValue="rides">
          <div className="overflow-x-auto -mx-3 px-3 mb-4">
            <TabsList className="inline-flex w-max h-10 bg-muted rounded-xl p-1 gap-0">
              <TabsTrigger
                value="rides"
                className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                <Icon name="Car" className="h-3.5 w-3.5 mr-1.5" />
                Поездки
                {rides.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted-foreground/20 px-1.5 rounded-full">
                    {rides.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                onClick={() => { if (!isAuth) { setShowAuthScreen(true); } }}
              >
                <Icon name="Ticket" className="h-3.5 w-3.5 mr-1.5" />
                Мои бронирования
                {activeBookings.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-semibold">
                    {activeBookings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══ TAB: Rides ══ */}
          <TabsContent value="rides" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rides.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Icon name="Car" className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Нет доступных поездок</p>
                    <p className="text-sm text-muted-foreground mt-1">Предложите свою поездку первым!</p>
                  </div>
                  {isAuth ? (
                    <Button
                      className="gradient-primary text-white min-h-[44px]"
                      onClick={() => setCreateDialog(true)}
                    >
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      Предложить поездку
                    </Button>
                  ) : (
                    <Button variant="outline" className="min-h-[44px]" onClick={() => setShowAuthScreen(true)}>
                      <Icon name="LogIn" className="mr-2 h-4 w-4" />
                      Войти, чтобы добавить поездку
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rides.map(ride => {
                  const isFull = ride.seats_available === 0;
                  const isExpired = ride.expires_at ? new Date(ride.expires_at) < new Date() : false;
                  const unavailable = isFull || isExpired;
                  return (
                    <Card
                      key={ride.id}
                      className={`border transition-shadow ${unavailable ? 'opacity-60' : 'hover:shadow-md'}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Route */}
                        <RoutePin from={ride.route_from} to={ride.route_to} />

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                            <Icon name="Calendar" className="h-3 w-3" />
                            {formatDatetime(ride.departure_datetime)}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            isFull
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <Icon name="Users" className="h-3 w-3" />
                            {isFull ? 'Мест нет' : `${ride.seats_available} из ${ride.seats_total}`}
                          </span>
                          <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                            <Icon name="Car" className="h-3 w-3" />
                            {CAR_CLASS_LABELS[ride.car_class] || ride.car_class}
                          </span>
                          {ride.created_by_name && (
                            <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full truncate max-w-[130px]">
                              <Icon name="User" className="h-3 w-3 shrink-0" />
                              {ride.created_by_name}
                            </span>
                          )}
                          {ride.expires_at && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                              isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              <Icon name="Clock" className="h-3 w-3" />
                              до {formatDate(ride.expires_at)}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {ride.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">
                            {ride.notes}
                          </p>
                        )}

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div>
                            <span className="font-bold text-primary text-lg leading-none">
                              {Number(ride.price_per_seat) > 0
                                ? `${Number(ride.price_per_seat).toLocaleString('ru-RU')} ₽`
                                : 'Договорная'}
                            </span>
                            {Number(ride.price_per_seat) > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">/место</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="gradient-primary text-white min-h-[40px] px-5"
                            disabled={unavailable}
                            onClick={() => {
                              if (!isAuth) { setShowAuthScreen(true); return; }
                              openBookDialog(ride);
                            }}
                          >
                            {unavailable ? (isFull ? 'Мест нет' : 'Недоступно') : 'Записаться'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ══ TAB: My bookings ══ */}
          <TabsContent value="bookings" className="mt-0">
            {!isAuth ? (
              <Card>
                <CardContent className="py-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Icon name="Lock" className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Требуется авторизация</p>
                    <p className="text-sm text-muted-foreground mt-1">Войдите, чтобы видеть свои бронирования</p>
                  </div>
                  <Button className="gradient-primary text-white min-h-[44px]" onClick={() => setShowAuthScreen(true)}>
                    <Icon name="LogIn" className="mr-2 h-4 w-4" />
                    Войти / Зарегистрироваться
                  </Button>
                </CardContent>
              </Card>
            ) : myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Icon name="Ticket" className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Бронирований пока нет</p>
                    <p className="text-sm text-muted-foreground mt-1">Найдите поездку и займите место</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => {
                  const statusCfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                  const isCancelled = b.status === 'cancelled';
                  return (
                    <Card key={b.id} className={isCancelled ? 'opacity-60' : ''}>
                      <CardContent className="p-4 space-y-3">
                        {/* Route */}
                        {b.route_from && b.route_to ? (
                          <RoutePin from={b.route_from} to={b.route_to} />
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">
                            Поездка #{b.rideshare_id}
                          </p>
                        )}

                        {/* Meta + status */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                            {b.departure_datetime && (
                              <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                                <Icon name="Calendar" className="h-3 w-3" />
                                {formatDatetime(b.departure_datetime)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full">
                              <Icon name="Users" className="h-3 w-3" />
                              {b.seats_count} {b.seats_count === 1 ? 'место' : 'места'}
                            </span>
                            {b.price_per_seat && b.price_per_seat > 0 && (
                              <span className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-full font-semibold text-foreground">
                                <Icon name="Banknote" className="h-3 w-3" />
                                {(b.price_per_seat * b.seats_count).toLocaleString('ru-RU')} ₽
                              </span>
                            )}
                          </div>
                          <Badge variant={statusCfg.variant} className="text-xs shrink-0">
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* Cancel button */}
                        {b.cancel_token && !isCancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full min-h-[40px] text-xs text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => setCancelConfirmToken(b.cancel_token!)}
                          >
                            <Icon name="X" className="h-3.5 w-3.5 mr-1.5" />
                            Отменить бронирование
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── FAB: offer a ride (auth only) ── */}
      {isAuth && (
        <button
          onClick={() => setCreateDialog(true)}
          className="fixed bottom-6 right-4 md:right-6 z-50 h-14 px-5 rounded-full gradient-primary text-white shadow-xl flex items-center gap-2 font-semibold hover:scale-105 active:scale-95 transition-transform"
          aria-label="Предложить поездку"
        >
          <Icon name="Plus" className="h-5 w-5" />
          <span className="hidden sm:inline">Предложить поездку</span>
        </button>
      )}

      {/* ════ DIALOG: Create ride ════ */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предложить поездку</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
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

            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="Navigation" className="inline h-3.5 w-3.5 mr-1 text-red-500" />
                Куда
              </Label>
              <Input
                className="h-11"
                placeholder="Красная Поляна, Адлер..."
                value={createForm.route_to}
                onChange={e => setCreateForm(f => ({ ...f, route_to: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="Calendar" className="inline h-3.5 w-3.5 mr-1 text-primary" />
                Дата и время отправления
              </Label>
              <Input
                className="h-11"
                type="datetime-local"
                min={nowDatetimeLocal()}
                value={createForm.departure_datetime}
                onChange={e => setCreateForm(f => ({ ...f, departure_datetime: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Мест в машине</Label>
                <Select
                  value={createForm.seats_total}
                  onValueChange={v => setCreateForm(f => ({ ...f, seats_total: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'место' : 'места'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Цена/место (₽)</Label>
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

            <div className="space-y-1.5">
              <Label className="text-sm">
                <Icon name="Clock" className="inline h-3.5 w-3.5 mr-1 text-orange-400" />
                Объявление активно до <span className="font-normal text-muted-foreground">(необязательно)</span>
              </Label>
              <Input
                className="h-11"
                type="datetime-local"
                min={nowDatetimeLocal()}
                value={createForm.expires_at}
                onChange={e => setCreateForm(f => ({ ...f, expires_at: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">По умолчанию — время отправления</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Комментарий <span className="font-normal text-muted-foreground">(необязательно)</span>
              </Label>
              <Textarea
                placeholder="Дополнительная информация для пассажиров..."
                rows={2}
                value={createForm.notes}
                onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 min-h-[48px]"
                onClick={() => setCreateDialog(false)}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 gradient-primary text-white min-h-[48px] font-semibold"
                onClick={handleCreateRide}
                disabled={createLoading}
              >
                {createLoading
                  ? <><Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />Создаём...</>
                  : <><Icon name="Plus" className="h-4 w-4 mr-2" />Создать</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ DIALOG: Book a seat ════ */}
      <Dialog open={bookDialog} onOpenChange={v => { setBookDialog(v); if (!v) setSelectedRide(null); }}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Записаться на поездку</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4 pt-1">
              {/* Ride summary */}
              <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                <RoutePin from={selectedRide.route_from} to={selectedRide.route_to} />
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" className="h-3 w-3" />
                    {formatDatetime(selectedRide.departure_datetime)}
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Icon name="Users" className="h-3 w-3" />
                    {selectedRide.seats_available} мест доступно
                  </span>
                </div>
              </div>

              {/* Creator info */}
              {selectedRide.created_by_name && (
                <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon name="User" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{selectedRide.created_by_name}</p>
                    {selectedRide.created_by_phone && (
                      <a
                        href={`tel:${selectedRide.created_by_phone}`}
                        className="text-xs text-blue-600 flex items-center gap-1 mt-0.5"
                      >
                        <Icon name="Phone" className="h-3 w-3" />
                        {selectedRide.created_by_phone}
                      </a>
                    )}
                    <p className="text-xs text-blue-500 mt-0.5">Организатор поездки</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRide.notes && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">
                  {selectedRide.notes}
                </p>
              )}

              {/* Seat count stepper */}
              <div className="space-y-1.5">
                <Label className="text-sm">Количество мест</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBookSeats(s => Math.max(1, s - 1))}
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
                    onClick={() => setBookSeats(s => Math.min(selectedRide.seats_available, s + 1))}
                    disabled={bookSeats >= selectedRide.seats_available}
                    className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary transition-colors disabled:opacity-30"
                  >
                    <Icon name="Plus" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Total */}
              {Number(selectedRide.price_per_seat) > 0 && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium">Итого</span>
                  <span className="text-xl font-bold text-primary">
                    {bookTotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                <Icon name="Info" className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>После бронирования вы увидите контакты организатора. Оплата производится при встрече.</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[48px]"
                  onClick={() => { setBookDialog(false); setSelectedRide(null); }}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 gradient-primary text-white min-h-[48px] font-semibold"
                  onClick={handleBook}
                  disabled={bookLoading}
                >
                  {bookLoading
                    ? <><Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />Бронируем...</>
                    : <><Icon name="CheckCircle2" className="h-4 w-4 mr-2" />Подтвердить</>
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ DIALOG: Cancel booking confirm ════ */}
      <Dialog open={!!cancelConfirmToken} onOpenChange={open => { if (!open) setCancelConfirmToken(null); }}>
        <DialogContent className="mx-3 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Отменить бронирование?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Ваше место будет освобождено. Отменить это действие нельзя.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() => setCancelConfirmToken(null)}
              >
                Оставить
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[44px]"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading
                  ? <><Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />Отменяем...</>
                  : <><Icon name="X" className="h-4 w-4 mr-2" />Отменить</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassengerCabinet;
