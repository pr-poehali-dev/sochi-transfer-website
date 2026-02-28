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

const CAR_CLASS_LABELS: Record<string, string> = {
  economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн',
};

const formatDate = (dt: string) => {
  const d = new Date(dt);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const STORAGE_KEY_ID = 'passenger_user_id';
const STORAGE_KEY_NAME = 'passenger_user_name';
const STORAGE_KEY_PHONE = 'passenger_user_phone';

const PassengerCabinet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', password: '', password2: '' });
  const [authLoading, setAuthLoading] = useState(false);

  const [rides, setRides] = useState<Rideshare[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const [createDialog, setCreateDialog] = useState(false);
  const [bookDialog, setBookDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Rideshare | null>(null);

  const [createForm, setCreateForm] = useState({
    route_from: '', route_to: '', departure_datetime: '',
    seats_total: '4', price_per_seat: '', car_class: 'comfort', notes: ''
  });
  const [bookForm, setBookForm] = useState({ seats_count: '1' });

  const userId = localStorage.getItem(STORAGE_KEY_ID);
  const userName = localStorage.getItem(STORAGE_KEY_NAME) || '';
  const userPhone = localStorage.getItem(STORAGE_KEY_PHONE) || '';

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEY_ID);
    if (uid) {
      setIsAuth(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.rideshares}`);
      const d = await r.json();
      setRides((d.rideshares || []).filter((r: Rideshare) => r.status === 'active'));
    } catch { /* silent */ }

    const uid = localStorage.getItem(STORAGE_KEY_ID);
    if (uid) {
      try {
        const r = await fetch(`${API_URLS.rideshares}&action=my_bookings&user_id=${uid}`);
        const d = await r.json();
        setMyBookings(d.bookings || []);
      } catch { /* silent */ }
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    if (!authForm.phone || !authForm.password) {
      toast({ title: 'Введите телефон и пароль', variant: 'destructive' }); return;
    }
    if (authMode === 'register') {
      if (!authForm.name) { toast({ title: 'Введите имя', variant: 'destructive' }); return; }
      if (authForm.password !== authForm.password2) {
        toast({ title: 'Пароли не совпадают', variant: 'destructive' }); return;
      }
      if (authForm.password.length < 6) {
        toast({ title: 'Пароль минимум 6 символов', variant: 'destructive' }); return;
      }
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
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка');
      const user = data.user;
      localStorage.setItem(STORAGE_KEY_ID, String(user.id));
      localStorage.setItem(STORAGE_KEY_NAME, user.name);
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
        })
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
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Место забронировано!' });
      setBookDialog(false);
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
      toast({ title: d.cancelled ? 'Бронирование отменено' : d.message });
      loadData();
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6 cursor-pointer justify-center" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Users" className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gradient text-lg">Попутчики</span>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{authMode === 'login' ? 'Вход' : 'Регистрация'}</CardTitle>
              <CardDescription>{authMode === 'login' ? 'Войдите в аккаунт' : 'Создайте новый аккаунт'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <Label className="text-sm">Ваше имя</Label>
                  <Input className="mt-1" placeholder="Иван Иванов" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              )}
              <div>
                <Label className="text-sm">Телефон</Label>
                <Input className="mt-1" placeholder="+7 (900) 000-00-00" value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm">Пароль</Label>
                <Input className="mt-1" type="password" placeholder="Минимум 6 символов" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {authMode === 'register' && (
                <div>
                  <Label className="text-sm">Повторите пароль</Label>
                  <Input className="mt-1" type="password" placeholder="Повторите пароль" value={authForm.password2} onChange={e => setAuthForm(f => ({ ...f, password2: e.target.value }))} />
                </div>
              )}
              <Button className="w-full gradient-primary text-white mt-2" onClick={handleAuth} disabled={authLoading}>
                {authLoading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </Button>
              <p className="text-center text-sm text-muted-foreground pt-1">
                {authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <button className="text-primary underline font-medium" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                  {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => navigate('/')}>
                <Icon name="ArrowLeft" className="h-4 w-4 mr-1" /> На главную
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Шапка */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Users" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient text-sm">Попутчики</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <Icon name="LogOut" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Кнопка предложить поездку */}
        <Button className="w-full gradient-primary text-white mb-4 h-12 text-base" onClick={() => setCreateDialog(true)}>
          <Icon name="Plus" className="h-5 w-5 mr-2" />
          Предложить поездку
        </Button>

        <Tabs defaultValue="find">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="find" className="flex-1 text-xs sm:text-sm">Найти поездку</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 text-xs sm:text-sm">
              Мои брони {myBookings.length > 0 && `(${myBookings.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Найти поездку */}
          <TabsContent value="find">
            {loading ? (
              <div className="flex justify-center py-12">
                <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Car" className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Нет доступных поездок</p>
                  <p className="text-sm text-muted-foreground mt-1">Предложите свою поездку первым!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rides.map(ride => (
                  <Card key={ride.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Маршрут */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="w-0.5 h-6 bg-muted-foreground/30 my-1" />
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ride.route_from}</p>
                          <p className="text-sm text-muted-foreground truncate mt-2">{ride.route_to}</p>
                        </div>
                      </div>

                      {/* Детали */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" className="h-3 w-3" />
                          <span>{formatDate(ride.departure_datetime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Users" className="h-3 w-3" />
                          <span>{ride.seats_available} мест</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Car" className="h-3 w-3" />
                          <span>{CAR_CLASS_LABELS[ride.car_class] || ride.car_class}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="User" className="h-3 w-3" />
                          <span className="truncate">{ride.created_by_name || 'Водитель'}</span>
                        </div>
                      </div>

                      {ride.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-3">{ride.notes}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-lg">
                          {ride.price_per_seat > 0 ? `${ride.price_per_seat} ₽/чел` : 'Договорная'}
                        </span>
                        <Button
                          size="sm"
                          className="gradient-primary text-white"
                          disabled={ride.seats_available === 0}
                          onClick={() => { setSelectedRide(ride); setBookDialog(true); }}
                        >
                          {ride.seats_available === 0 ? 'Нет мест' : 'Забронировать'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Мои бронирования */}
          <TabsContent value="bookings">
            {myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Ticket" className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">У вас нет бронирований</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{b.route_from} → {b.route_to}</p>
                          {b.departure_datetime && (
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(b.departure_datetime)}</p>
                          )}
                        </div>
                        <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'secondary'}
                          className="text-xs flex-shrink-0">
                          {b.status === 'confirmed' ? 'Подтверждено' : b.status === 'cancelled' ? 'Отменено' : 'Ожидание'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {b.seats_count} мест · {b.price_per_seat ? `${b.price_per_seat * b.seats_count} ₽` : 'Договорная'}
                        </div>
                        {b.cancel_token && b.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => cancelBooking(b.cancel_token!)}>
                            Отменить
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Диалог создания поездки */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предложить поездку</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Откуда</Label>
              <Input className="mt-1" placeholder="Сочи, аэропорт" value={createForm.route_from}
                onChange={e => setCreateForm(f => ({ ...f, route_from: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm">Куда</Label>
              <Input className="mt-1" placeholder="Гагра, Пицунда..." value={createForm.route_to}
                onChange={e => setCreateForm(f => ({ ...f, route_to: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm">Дата и время</Label>
              <Input className="mt-1" type="datetime-local" value={createForm.departure_datetime}
                onChange={e => setCreateForm(f => ({ ...f, departure_datetime: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Мест</Label>
                <Input className="mt-1" type="number" min="1" max="8" value={createForm.seats_total}
                  onChange={e => setCreateForm(f => ({ ...f, seats_total: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm">Цена/чел (₽)</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={createForm.price_per_seat}
                  onChange={e => setCreateForm(f => ({ ...f, price_per_seat: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-sm">Класс авто</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {Object.entries(CAR_CLASS_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => setCreateForm(f => ({ ...f, car_class: v }))}
                    className={`text-sm py-2 px-3 rounded-lg border transition-colors ${createForm.car_class === v ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted/50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Комментарий</Label>
              <Textarea className="mt-1" placeholder="Дополнительная информация..." rows={2} value={createForm.notes}
                onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button className="w-full gradient-primary text-white" onClick={createRide}>
              Создать поездку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог бронирования */}
      <Dialog open={bookDialog} onOpenChange={setBookDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Забронировать место</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium">{selectedRide.route_from} → {selectedRide.route_to}</p>
                <p className="text-muted-foreground">{formatDate(selectedRide.departure_datetime)}</p>
                <p className="text-muted-foreground">Доступно мест: {selectedRide.seats_available}</p>
              </div>
              <div>
                <Label className="text-sm">Количество мест</Label>
                <Input className="mt-1" type="number" min="1" max={selectedRide.seats_available}
                  value={bookForm.seats_count}
                  onChange={e => setBookForm({ seats_count: e.target.value })} />
              </div>
              {selectedRide.price_per_seat > 0 && (
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span className="text-primary">{selectedRide.price_per_seat * parseInt(bookForm.seats_count || '1')} ₽</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                <Icon name="Info" className="h-3 w-3 inline mr-1" />
                Контактные данные будут переданы организатору поездки
              </div>
              <Button className="w-full gradient-primary text-white" onClick={bookRide}>
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
