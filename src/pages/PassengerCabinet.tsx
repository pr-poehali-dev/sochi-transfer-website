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
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 cursor-pointer justify-center" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Users" className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gradient text-xl">Попутчики</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{authMode === 'login' ? 'Вход' : 'Регистрация'}</CardTitle>
              <CardDescription>
                {authMode === 'login' ? 'Войдите чтобы найти попутчиков или предложить поездку' : 'Создайте аккаунт для попутчиков'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <Label>Имя <span className="text-red-500">*</span></Label>
                  <Input placeholder="Иван Иванов" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Телефон <span className="text-red-500">*</span></Label>
                <Input placeholder="+7 (900) 000-00-00" value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Пароль <span className="text-red-500">*</span></Label>
                <Input type="password" placeholder="Минимум 6 символов" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {authMode === 'register' && (
                <div>
                  <Label>Повторите пароль <span className="text-red-500">*</span></Label>
                  <Input type="password" placeholder="Повторите пароль" value={authForm.password2} onChange={e => setAuthForm(f => ({ ...f, password2: e.target.value }))} />
                </div>
              )}
              <Button className="w-full gradient-primary text-white" onClick={handleAuth} disabled={authLoading}>
                {authLoading && <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />}
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {authMode === 'login' ? (
                  <>Нет аккаунта? <button className="text-primary font-medium" onClick={() => setAuthMode('register')}>Зарегистрироваться</button></>
                ) : (
                  <>Уже есть аккаунт? <button className="text-primary font-medium" onClick={() => setAuthMode('login')}>Войти</button></>
                )}
              </p>
              <div className="text-center">
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
                  ← Вернуться на главную
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Users" className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gradient">Попутчики</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">Привет, {userName}!</span>
            <Button size="sm" variant="outline" onClick={logout}>
              <Icon name="LogOut" className="h-4 w-4 mr-1" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="find">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="find">
              <Icon name="Search" className="h-4 w-4 mr-2" />
              Найти поездку
            </TabsTrigger>
            <TabsTrigger value="offer">
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              Предложить поездку
            </TabsTrigger>
            <TabsTrigger value="mybookings">
              <Icon name="Ticket" className="h-4 w-4 mr-2" />
              Мои бронирования
            </TabsTrigger>
          </TabsList>

          {/* НАЙТИ ПОЕЗДКУ */}
          <TabsContent value="find">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Доступные поездки</h2>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <Icon name="RefreshCw" className="h-4 w-4 mr-1" />
                  Обновить
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rides.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icon name="Car" className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Нет доступных поездок</p>
                    <p className="text-sm text-muted-foreground mt-1">Предложите свою поездку или заходите позже</p>
                  </CardContent>
                </Card>
              ) : (
                rides.map(ride => (
                  <Card key={ride.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="MapPin" className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold">{ride.route_from} → {ride.route_to}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" className="h-3.5 w-3.5" />
                              {formatDate(ride.departure_datetime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="Users" className="h-3.5 w-3.5" />
                              {ride.seats_available} из {ride.seats_total} мест
                            </span>
                            <Badge variant="outline">{CAR_CLASS_LABELS[ride.car_class] || ride.car_class}</Badge>
                          </div>
                          {ride.driver_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Icon name="User" className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{ride.driver_name}</span>
                              {ride.driver_phone && (
                                <a href={`tel:${ride.driver_phone}`} className="text-primary text-xs">
                                  {ride.driver_phone}
                                </a>
                              )}
                            </div>
                          )}
                          {ride.notes && <p className="text-sm text-muted-foreground italic">{ride.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-2xl font-bold text-gradient">
                            {ride.price_per_seat > 0 ? `${ride.price_per_seat} ₽` : 'Бесплатно'}
                          </p>
                          <p className="text-xs text-muted-foreground">за место</p>
                          <Button
                            size="sm"
                            className="gradient-primary text-white"
                            disabled={ride.seats_available === 0}
                            onClick={() => { setSelectedRide(ride); setBookDialog(true); }}
                          >
                            {ride.seats_available === 0 ? 'Мест нет' : 'Забронировать'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ПРЕДЛОЖИТЬ ПОЕЗДКУ */}
          <TabsContent value="offer">
            <Card>
              <CardHeader>
                <CardTitle>Предложить поездку</CardTitle>
                <CardDescription>Создайте объявление и найдите попутчиков</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Откуда <span className="text-red-500">*</span></Label>
                    <Input placeholder="Сочи, аэропорт..." value={createForm.route_from} onChange={e => setCreateForm(f => ({ ...f, route_from: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Куда <span className="text-red-500">*</span></Label>
                    <Input placeholder="Сухуми, Гагра..." value={createForm.route_to} onChange={e => setCreateForm(f => ({ ...f, route_to: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Дата и время <span className="text-red-500">*</span></Label>
                    <Input type="datetime-local" value={createForm.departure_datetime} onChange={e => setCreateForm(f => ({ ...f, departure_datetime: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Цена за место (₽)</Label>
                    <Input type="number" placeholder="500" value={createForm.price_per_seat} onChange={e => setCreateForm(f => ({ ...f, price_per_seat: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Мест в машине</Label>
                    <Input type="number" min="1" max="10" value={createForm.seats_total} onChange={e => setCreateForm(f => ({ ...f, seats_total: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Класс авто</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md text-sm"
                      value={createForm.car_class}
                      onChange={e => setCreateForm(f => ({ ...f, car_class: e.target.value }))}
                    >
                      {Object.entries(CAR_CLASS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Комментарий</Label>
                  <Textarea placeholder="Дополнительная информация о поездке..." value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>
                <Button className="w-full gradient-primary text-white" onClick={createRide}>
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Опубликовать поездку
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* МОИ БРОНИРОВАНИЯ */}
          <TabsContent value="mybookings">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Мои бронирования</h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icon name="Ticket" className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Нет бронирований</p>
                    <p className="text-sm text-muted-foreground mt-1">Забронируйте место в доступных поездках</p>
                  </CardContent>
                </Card>
              ) : (
                myBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1">
                          {booking.route_from && (
                            <p className="font-semibold flex items-center gap-1">
                              <Icon name="MapPin" className="h-4 w-4 text-primary" />
                              {booking.route_from} → {booking.route_to}
                            </p>
                          )}
                          {booking.departure_datetime && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Icon name="Calendar" className="h-3.5 w-3.5" />
                              {formatDate(booking.departure_datetime)}
                            </p>
                          )}
                          <p className="text-sm">Мест: <strong>{booking.seats_count}</strong></p>
                          {booking.price_per_seat && (
                            <p className="text-sm">Итого: <strong>{booking.seats_count * booking.price_per_seat} ₽</strong></p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Забронировано: {new Date(booking.created_at).toLocaleDateString('ru')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            className={booking.status === 'confirmed' ? 'bg-green-500 text-white' : ''}>
                            {booking.status === 'confirmed' ? 'Подтверждено' :
                             booking.status === 'cancelled' ? 'Отменено' : 'Ожидание'}
                          </Badge>
                          {booking.status === 'confirmed' && booking.cancel_token && (
                            <Button size="sm" variant="outline" className="text-destructive border-destructive"
                              onClick={() => cancelBooking(booking.cancel_token!)}>
                              Отменить
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Dialog */}
      <Dialog open={bookDialog} onOpenChange={setBookDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Забронировать место</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <p className="font-semibold">{selectedRide.route_from} → {selectedRide.route_to}</p>
                <p className="text-muted-foreground">{formatDate(selectedRide.departure_datetime)}</p>
                <p>Доступно мест: <strong>{selectedRide.seats_available}</strong></p>
                {selectedRide.price_per_seat > 0 && (
                  <p>Цена: <strong>{selectedRide.price_per_seat} ₽/место</strong></p>
                )}
              </div>
              <div>
                <Label>Количество мест</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedRide.seats_available}
                  value={bookForm.seats_count}
                  onChange={e => setBookForm({ seats_count: e.target.value })}
                />
              </div>
              {selectedRide.price_per_seat > 0 && (
                <p className="text-sm font-semibold">
                  Итого: {parseInt(bookForm.seats_count || '1') * selectedRide.price_per_seat} ₽
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setBookDialog(false)}>Отмена</Button>
                <Button className="flex-1 gradient-primary text-white" onClick={bookRide}>Забронировать</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassengerCabinet;
