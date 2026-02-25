import { useState, useEffect } from 'react';
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

const TRANSFER_TYPES = [
  { value: 'individual', label: 'Индивидуальный', description: 'Только для вас', icon: 'User' },
  { value: 'group', label: 'Групповой', description: 'Минивэн / автобус', icon: 'Users' },
];

const CAR_CLASSES = [
  { value: 'economy', label: 'Эконом', description: 'Лада, Hyundai', multiplier: 1.0 },
  { value: 'comfort', label: 'Комфорт', description: 'Toyota, Kia', multiplier: 1.3 },
  { value: 'business', label: 'Бизнес', description: 'Mercedes, BMW', multiplier: 1.7 },
  { value: 'minivan', label: 'Минивэн', description: 'до 7 пассажиров', multiplier: 1.5 },
];

const BookingForm = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transferType, setTransferType] = useState('individual');
  const [carClass, setCarClass] = useState('comfort');
  const [basePrice, setBasePrice] = useState(0);
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
    payment_type: 'full',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const response = await fetch(`${API_URLS.tariffs}?active=true`);
      const data = await response.json();
      setTariffs(data.tariffs || []);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const calcPrice = (base: number, cls: string, type: string) => {
    const classMultiplier = CAR_CLASSES.find(c => c.value === cls)?.multiplier || 1;
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
    setFormData(prev => ({ ...prev, transfer_type: type }));
  };

  const prepayAmount = Math.round(formData.price * 0.3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_URLS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tariff_id: parseInt(formData.tariff_id),
          status_id: 1,
          passengers_count: parseInt(formData.passengers_count),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccessDialogOpen(true);
        setFormData({
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
          payment_type: 'full',
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
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="grid gap-5">

            {/* Тип трансфера */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Тип трансфера</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRANSFER_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTransferTypeChange(type.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      transferType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white/50 hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${transferType === type.value ? 'gradient-primary' : 'bg-muted'}`}>
                      <Icon name={type.icon as 'User' | 'Users'} className={`h-4 w-4 ${transferType === type.value ? 'text-white' : 'text-muted-foreground'}`} />
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
                {CAR_CLASSES.map(cls => (
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
                    <p className="font-semibold text-sm">{cls.label}</p>
                    <p className="text-xs text-muted-foreground">{cls.description}</p>
                    {cls.multiplier > 1 && (
                      <Badge variant="outline" className="text-xs mt-1">×{cls.multiplier}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Дата и рейс */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата и время подачи</Label>
                <Input
                  type="datetime-local"
                  value={formData.pickup_datetime}
                  onChange={(e) => setFormData({ ...formData, pickup_datetime: e.target.value })}
                  className="bg-white/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Кол-во пассажиров</Label>
                <Select value={formData.passengers_count} onValueChange={(v) => setFormData({ ...formData, passengers_count: v })}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'пассажир' : n < 5 ? 'пассажира' : 'пассажиров'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Номер рейса (опционально)</Label>
              <Input
                placeholder="SU 1234"
                value={formData.flight_number}
                onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                className="bg-white/50"
              />
            </div>

            {/* Контакты */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Контактные данные</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>ФИО пассажира</Label>
                  <Input
                    placeholder="Иванов Иван Иванович"
                    value={formData.passenger_name}
                    onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                    className="bg-white/50"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
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
                      required
                    />
                  </div>
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'full' }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_type === 'full' ? 'border-primary bg-primary/10' : 'border-border bg-white/50'}`}
                    >
                      <p className="font-semibold text-sm">Полная оплата</p>
                      <p className="text-lg font-bold">{formData.price} ₽</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'prepay' }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${formData.payment_type === 'prepay' ? 'border-primary bg-primary/10' : 'border-border bg-white/50'}`}
                    >
                      <p className="font-semibold text-sm">Предоплата 30%</p>
                      <p className="text-lg font-bold">{prepayAmount} ₽</p>
                      <p className="text-xs text-muted-foreground">+{formData.price - prepayAmount} ₽ при посадке</p>
                    </button>
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
                <><Icon name="Send" className="mr-2 h-5 w-5" />Отправить заявку</>
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
            <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full gradient-primary text-white">
              Готово
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;
