import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Tariff {
  id: number;
  city: string;
  price: number;
}

interface TransferType {
  id: number;
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface CarClass {
  id: number;
  value: string;
  label: string;
  description: string;
  price_multiplier: number;
}

const DEFAULT_TRANSFER_TYPES: TransferType[] = [
  { id: 1, value: 'individual', label: 'Индивидуальный', description: 'Только для вас', icon: 'User' },
  { id: 2, value: 'group', label: 'Групповой', description: '1 500 ₽ с человека', icon: 'Users' },
];

const DEFAULT_CAR_CLASSES: CarClass[] = [
  { id: 1, value: 'economy', label: 'Эконом', description: 'Лада, Hyundai', price_multiplier: 1.0 },
  { id: 2, value: 'comfort', label: 'Комфорт', description: 'Toyota, Kia', price_multiplier: 1.3 },
  { id: 3, value: 'business', label: 'Бизнес', description: 'Mercedes, BMW', price_multiplier: 1.7 },
  { id: 4, value: 'minivan', label: 'Минивэн', description: 'до 7 пассажиров', price_multiplier: 1.5 },
];

const BookingForm = () => {
  const navigate = useNavigate();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [transferTypes, setTransferTypes] = useState<TransferType[]>(DEFAULT_TRANSFER_TYPES);
  const [carClasses, setCarClasses] = useState<CarClass[]>(DEFAULT_CAR_CLASSES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transferType, setTransferType] = useState('individual');
  const [carClass, setCarClass] = useState('comfort');
  const [basePrice, setBasePrice] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    from_location: 'Аэропорт Сочи',
    to_location: '',
    pickup_datetime: '',
    flight_number: '',
    passenger_name: '',
    passenger_phone: '',
    passenger_email: '',
    passengers_count: '1',
    tariff_id: '',
    price: 0,
    transfer_type: 'individual',
    car_class: 'comfort',
    payment_type: 'cash',
    payment_from_balance: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTariffs();
    loadTransferConfig();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setIsLoggedIn(true);
      const name = localStorage.getItem('user_name') || '';
      const phone = localStorage.getItem('user_phone') || '';
      setFormData(prev => ({ ...prev, passenger_name: name, passenger_phone: phone }));
      try {
        const r = await fetch(`${API_URLS.users}&action=profile`, { headers: { 'X-User-Id': userId } });
        const d = await r.json();
        if (d.user) setUserBalance(parseFloat(d.user.balance || 0));
      } catch { /* silent */ }
    }
  };

  const loadTariffs = async () => {
    try {
      const response = await fetch(`${API_URLS.tariffs}?active=true`);
      const data = await response.json();
      setTariffs(data.tariffs || []);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const loadTransferConfig = async () => {
    try {
      const [ttRes, ccRes] = await Promise.all([
        fetch(`${API_URLS.transferTypes}&active=true`),
        fetch(`${API_URLS.carClasses}&active=true`)
      ]);
      const ttData = await ttRes.json();
      const ccData = await ccRes.json();
      if (ttData.transfer_types?.length) setTransferTypes(ttData.transfer_types);
      if (ccData.car_classes?.length) setCarClasses(ccData.car_classes);
    } catch { /* use defaults */ }
  };

  const calcPrice = (base: number, cls: string, type: string, pCount?: number) => {
    if (type === 'group') {
      return Math.round(1500 * (pCount || parseInt(formData.passengers_count) || 1));
    }
    const classMultiplier = carClasses.find(c => c.value === cls)?.price_multiplier || 1;
    return Math.round(base * classMultiplier);
  };

  const handleTariffChange = (tariffId: string) => {
    const tariff = tariffs.find(t => t.id.toString() === tariffId);
    if (tariff) {
      setBasePrice(tariff.price);
      const price = calcPrice(tariff.price, carClass, transferType);
      setFormData(prev => ({
        ...prev,
        tariff_id: tariffId,
        to_location: tariff.city,
        price,
        payment_from_balance: false,
      }));
    }
  };

  const handleCarClassChange = (cls: string) => {
    setCarClass(cls);
    if (basePrice > 0) {
      const price = calcPrice(basePrice, cls, transferType);
      setFormData(prev => ({ ...prev, car_class: cls, price }));
    } else {
      setFormData(prev => ({ ...prev, car_class: cls }));
    }
  };

  const handleTransferTypeChange = (type: string) => {
    setTransferType(type);
    const price = basePrice > 0 ? calcPrice(basePrice, carClass, type) : 0;
    setFormData(prev => ({ ...prev, transfer_type: type, price }));
  };

  const prepayAmount = Math.round(formData.price * 0.3);
  const canPayByBalance = isLoggedIn && userBalance >= formData.price && formData.price > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Необходима авторизация',
        description: 'Для оформления заказа войдите в аккаунт',
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_URLS.orders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          ...formData,
          tariff_id: parseInt(formData.tariff_id),
          status_id: 1,
          passengers_count: parseInt(formData.passengers_count),
          user_id: parseInt(userId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (formData.payment_from_balance) {
          setUserBalance(prev => prev - formData.price);
        }
        // Редирект на оплату если провайдер вернул ссылку
        if (data.payment_url) {
          window.location.href = data.payment_url;
          return;
        }
        setIsSuccessDialogOpen(true);
        setFormData({
          from_location: 'Аэропорт Сочи',
          to_location: '',
          pickup_datetime: '',
          flight_number: '',
          passenger_name: localStorage.getItem('user_name') || '',
          passenger_phone: localStorage.getItem('user_phone') || '',
          passenger_email: '',
          passengers_count: '1',
          tariff_id: '',
          price: 0,
          transfer_type: 'individual',
          car_class: 'comfort',
          payment_type: 'cash',
          payment_from_balance: false,
        });
        setBasePrice(0);
      } else {
        toast({ variant: 'destructive', title: 'Ошибка', description: data.error || 'Не удалось создать заявку' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить заявку' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto glass-effect border-white/40 shadow-2xl animate-scale-in">
        <CardContent className="p-4 sm:p-8">
          {!isLoggedIn && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
              <Icon name="AlertCircle" className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-800">Нужен аккаунт для заказа</p>
                <p className="text-xs text-yellow-600 hidden sm:block">Войдите или зарегистрируйтесь бесплатно</p>
              </div>
              <Button size="sm" className="gradient-primary text-white flex-shrink-0" onClick={() => navigate('/auth')}>
                Войти
              </Button>
            </div>
          )}

          {isLoggedIn && userBalance > 0 && (
            <div className="mb-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Icon name="Wallet" className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">Ваш баланс</span>
              </div>
              <Badge className="bg-green-500 text-white">{userBalance.toFixed(0)} ₽</Badge>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5">

            {/* Тип трансфера */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Тип трансфера</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {transferTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTransferTypeChange(type.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left w-full ${
                      transferType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white/50 hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${transferType === type.value ? 'gradient-primary' : 'bg-muted'}`}>
                      <Icon name={type.icon as 'User'} className={`h-5 w-5 ${transferType === type.value ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Маршрут */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Откуда</Label>
                <Input
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  className="bg-white/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Куда</Label>
                <Select value={formData.tariff_id} onValueChange={handleTariffChange} required>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs.map(tariff => (
                      <SelectItem key={tariff.id} value={tariff.id.toString()}>
                        {tariff.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Класс автомобиля */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Класс автомобиля</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {carClasses.map(cls => (
                  <button
                    key={cls.value}
                    type="button"
                    onClick={() => handleCarClassChange(cls.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      carClass === cls.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white/50 hover:border-primary/40'
                    }`}
                  >
                    <p className="font-semibold text-xs">{cls.label}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{cls.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Дата и рейс */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата и время</Label>
                <Input
                  type="datetime-local"
                  value={formData.pickup_datetime}
                  onChange={(e) => setFormData({ ...formData, pickup_datetime: e.target.value })}
                  className="bg-white/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Номер рейса</Label>
                <Input
                  placeholder="SU 1234"
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  className="bg-white/50"
                />
              </div>
            </div>

            {/* Пассажиры */}
            <div className="space-y-2">
              <Label>Количество пассажиров</Label>
              <Select
                value={formData.passengers_count}
                onValueChange={(v) => {
                  const price = basePrice > 0 ? calcPrice(basePrice, carClass, transferType, parseInt(v)) : 0;
                  setFormData({ ...formData, passengers_count: v, price });
                }}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'пассажир' : n < 5 ? 'пассажира' : 'пассажиров'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Контакты пассажира */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Контактные данные</Label>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input
                    placeholder="Иван Иванов"
                    value={formData.passenger_name}
                    onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                    className="bg-white/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={formData.passenger_phone}
                    onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                    className="bg-white/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.passenger_email}
                    onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                    className="bg-white/50"
                  />
                </div>
              </div>
            </div>

            {/* Цена и оплата */}
            {formData.price > 0 && (
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Стоимость трансфера</p>
                  <p className="text-3xl font-bold text-gradient">{formData.price} ₽</p>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-semibold mb-2">Способ оплаты</p>
                  <div className={`grid gap-2 ${canPayByBalance ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'cash', payment_from_balance: false }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_type === 'cash' && !formData.payment_from_balance ? 'border-primary bg-primary/10' : 'border-border bg-white/50'}`}
                    >
                      <p className="font-semibold text-sm">Наличные</p>
                      <p className="text-lg font-bold">{formData.price} ₽</p>
                      <p className="text-xs text-muted-foreground">при посадке</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'full', payment_from_balance: false }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_type === 'full' && !formData.payment_from_balance ? 'border-primary bg-primary/10' : 'border-border bg-white/50'}`}
                    >
                      <p className="font-semibold text-sm">Онлайн</p>
                      <p className="text-lg font-bold">{formData.price} ₽</p>
                      <p className="text-xs text-muted-foreground">картой</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'prepay', payment_from_balance: false }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_type === 'prepay' && !formData.payment_from_balance ? 'border-primary bg-primary/10' : 'border-border bg-white/50'}`}
                    >
                      <p className="font-semibold text-sm">Предоплата 30%</p>
                      <p className="text-lg font-bold">{prepayAmount} ₽</p>
                      <p className="text-xs text-muted-foreground">+{formData.price - prepayAmount} ₽ при посадке</p>
                    </button>
                    {canPayByBalance && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payment_type: 'full', payment_from_balance: true }))}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_from_balance ? 'border-green-500 bg-green-50' : 'border-border bg-white/50'}`}
                      >
                        <p className="font-semibold text-sm text-green-700">С баланса</p>
                        <p className="text-lg font-bold text-green-700">{formData.price} ₽</p>
                        <p className="text-xs text-green-600">Баланс: {userBalance.toFixed(0)} ₽</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gradient-primary text-white font-semibold text-lg h-14 hover:scale-105 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />Отправка...</>
              ) : (
                <><Icon name="Send" className="mr-2 h-5 w-5" />{isLoggedIn ? 'Отправить заявку' : 'Войти и заказать'}</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="CheckCircle2" className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Заявка принята!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Менеджер свяжется с вами в ближайшее время для подтверждения трансфера.
            </p>
            <Button onClick={() => { setIsSuccessDialogOpen(false); navigate('/profile'); }} className="w-full gradient-primary text-white">
              Смотреть мои заказы
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;