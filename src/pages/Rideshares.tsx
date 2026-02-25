import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Rideshare {
  id: number;
  route_from: string;
  route_to: string;
  departure_datetime: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  car_class: string;
  driver_name: string;
  notes: string;
  status: string;
  created_by_name: string;
}

const CAR_CLASS_LABELS: Record<string, string> = {
  economy: 'Эконом',
  comfort: 'Комфорт',
  business: 'Бизнес',
  minivan: 'Минивэн',
};

const formatDate = (dt: string) => {
  const d = new Date(dt);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const Rideshares = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rides, setRides] = useState<Rideshare[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Rideshare | null>(null);
  const [cancelToken, setCancelToken] = useState('');
  const [myBookingToken, setMyBookingToken] = useState('');
  const [createForm, setCreateForm] = useState({
    route_from: '',
    route_to: '',
    departure_datetime: '',
    seats_total: '3',
    price_per_seat: '',
    car_class: 'comfort',
    notes: '',
    created_by_name: '',
    created_by_phone: '',
  });
  const [bookForm, setBookForm] = useState({
    passenger_name: '',
    passenger_phone: '',
    passenger_email: '',
    seats_count: '1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URLS.rideshares);
      const data = await res.json();
      setRides(data.rideshares || []);
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить поездки' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, seats_total: parseInt(createForm.seats_total), price_per_seat: parseInt(createForm.price_per_seat), action: 'create' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Поездка создана!', description: 'Ваша поездка добавлена в список' });
        setShowCreateDialog(false);
        loadRides();
        setCreateForm({ route_from: '', route_to: '', departure_datetime: '', seats_total: '3', price_per_seat: '', car_class: 'comfort', notes: '', created_by_name: '', created_by_phone: '' });
      } else {
        toast({ variant: 'destructive', title: 'Ошибка', description: data.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать поездку' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(API_URLS.rideshares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          rideshare_id: selectedRide.id,
          ...bookForm,
          seats_count: parseInt(bookForm.seats_count),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyBookingToken(data.cancel_token);
        setShowBookDialog(false);
        loadRides();
        toast({ title: 'Вы записаны!', description: 'Сохраните токен для отмены' });
      } else {
        toast({ variant: 'destructive', title: 'Ошибка', description: data.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось записаться' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelToken.trim()) return;
    try {
      const res = await fetch(`${API_URLS.rideshares}&cancel_token=${cancelToken.trim()}`);
      const data = await res.json();
      toast({ title: data.cancelled ? 'Запись отменена' : 'Ошибка', description: data.message, variant: data.cancelled ? 'default' : 'destructive' });
      if (data.cancelled) { setShowCancelDialog(false); setCancelToken(''); loadRides(); }
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отменить запись' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Навбар */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-gradient">ПоехалиПро</span>
                <span className="text-xs text-muted-foreground">Трансфер Абхазия-Россия</span>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Icon name="ArrowLeft" className="mr-1 h-4 w-4" /> На главную
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <Badge className="mb-4 gradient-primary text-white border-0">Попутчики</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Найди попутчика в Абхазию</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Раздели стоимость трансфера с другими пассажирами или предложи свободные места в своей машине
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button className="gradient-primary text-white" onClick={() => setShowCreateDialog(true)}>
              <Icon name="Plus" className="mr-2 h-4 w-4" /> Предложить поездку
            </Button>
            <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
              <Icon name="XCircle" className="mr-2 h-4 w-4" /> Отменить запись
            </Button>
          </div>
        </div>

        {/* Если есть токен после записи */}
        {myBookingToken && (
          <div className="max-w-md mx-auto mb-8">
            <Card className="border-2 border-green-400 bg-green-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Icon name="CheckCircle2" className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 mb-1">Вы записаны!</p>
                    <p className="text-sm text-green-700 mb-2">Сохраните токен для отмены записи:</p>
                    <code className="text-sm font-mono bg-green-100 px-2 py-1 rounded break-all">{myBookingToken}</code>
                    <Button variant="ghost" size="sm" className="mt-2 w-full text-green-700" onClick={() => setMyBookingToken('')}>
                      Скрыть
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Список поездок */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Car" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-2">Нет доступных поездок</p>
            <p className="text-muted-foreground">Будьте первым — предложите поездку!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {rides.map(ride => (
              <Card key={ride.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Icon name="Calendar" className="h-3.5 w-3.5" />
                        {formatDate(ride.departure_datetime)}
                      </div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {ride.route_from}
                        <Icon name="ArrowRight" className="h-4 w-4 text-primary" />
                        {ride.route_to}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{CAR_CLASS_LABELS[ride.car_class] || ride.car_class}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Users" className="h-4 w-4 text-primary" />
                      <span>Мест: <strong>{ride.seats_available}</strong> из {ride.seats_total}</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient">{ride.price_per_seat} ₽</div>
                  </div>
                  
                  {/* Прогресс-бар мест */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="gradient-primary h-2 rounded-full transition-all"
                      style={{ width: `${((ride.seats_total - ride.seats_available) / ride.seats_total) * 100}%` }}
                    />
                  </div>

                  {ride.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ride.notes}</p>
                  )}

                  {ride.driver_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="User" className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{ride.driver_name}</span>
                    </div>
                  )}

                  <Button
                    className="w-full gradient-primary text-white"
                    disabled={ride.seats_available === 0}
                    onClick={() => { setSelectedRide(ride); setShowBookDialog(true); }}
                  >
                    {ride.seats_available === 0 ? 'Мест нет' : 'Записаться'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Диалог создания поездки */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предложить поездку</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Откуда</Label>
                <Input placeholder="Аэропорт Сочи" value={createForm.route_from} onChange={e => setCreateForm(p => ({...p, route_from: e.target.value}))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Куда</Label>
                <Input placeholder="Гагра" value={createForm.route_to} onChange={e => setCreateForm(p => ({...p, route_to: e.target.value}))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Дата и время отправления</Label>
              <Input type="datetime-local" value={createForm.departure_datetime} onChange={e => setCreateForm(p => ({...p, departure_datetime: e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Свободных мест</Label>
                <Select value={createForm.seats_total} onValueChange={v => setCreateForm(p => ({...p, seats_total: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Цена за место (₽)</Label>
                <Input type="number" placeholder="1500" value={createForm.price_per_seat} onChange={e => setCreateForm(p => ({...p, price_per_seat: e.target.value}))} required min="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Класс авто</Label>
              <Select value={createForm.car_class} onValueChange={v => setCreateForm(p => ({...p, car_class: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Эконом</SelectItem>
                  <SelectItem value="comfort">Комфорт</SelectItem>
                  <SelectItem value="business">Бизнес</SelectItem>
                  <SelectItem value="minivan">Минивэн</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ваше имя</Label>
              <Input placeholder="Иван Иванов" value={createForm.created_by_name} onChange={e => setCreateForm(p => ({...p, created_by_name: e.target.value}))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Ваш телефон</Label>
              <Input type="tel" placeholder="+7 (999) 123-45-67" value={createForm.created_by_phone} onChange={e => setCreateForm(p => ({...p, created_by_phone: e.target.value}))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Примечание (необязательно)</Label>
              <Textarea placeholder="Любая полезная информация..." value={createForm.notes} onChange={e => setCreateForm(p => ({...p, notes: e.target.value}))} rows={2} />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Создание...</> : 'Опубликовать поездку'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог записи */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Записаться в поездку</DialogTitle>
            {selectedRide && (
              <CardDescription>
                {selectedRide.route_from} → {selectedRide.route_to} · {formatDate(selectedRide.departure_datetime)}
              </CardDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ваше имя</Label>
              <Input placeholder="Иван Иванов" value={bookForm.passenger_name} onChange={e => setBookForm(p => ({...p, passenger_name: e.target.value}))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон</Label>
              <Input type="tel" placeholder="+7 (999) 123-45-67" value={bookForm.passenger_phone} onChange={e => setBookForm(p => ({...p, passenger_phone: e.target.value}))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email (необязательно)</Label>
              <Input type="email" placeholder="email@example.com" value={bookForm.passenger_email} onChange={e => setBookForm(p => ({...p, passenger_email: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>Количество мест</Label>
              <Select value={bookForm.seats_count} onValueChange={v => setBookForm(p => ({...p, seats_count: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({length: selectedRide?.seats_available || 1}, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'место' : 'места'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRide && (
              <div className="bg-primary/10 p-3 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">К оплате</p>
                <p className="text-2xl font-bold text-gradient">{selectedRide.price_per_seat * parseInt(bookForm.seats_count)} ₽</p>
              </div>
            )}
            <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Запись...</> : 'Записаться'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог отмены */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отменить запись</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Введите токен, который вы получили при записи в поездку</p>
            <div className="space-y-1.5">
              <Label>Токен отмены</Label>
              <Input placeholder="Вставьте токен..." value={cancelToken} onChange={e => setCancelToken(e.target.value)} />
            </div>
            <Button className="w-full" variant="destructive" onClick={handleCancel} disabled={!cancelToken.trim()}>
              <Icon name="XCircle" className="mr-2 h-4 w-4" /> Отменить запись
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rideshares;
