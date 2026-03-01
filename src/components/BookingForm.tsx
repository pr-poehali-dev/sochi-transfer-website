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

// ─── Types ────────────────────────────────────────────────────────────────────

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
  price_multiplier?: number;
}

interface CarClass {
  id: number;
  value: string;
  label: string;
  description: string;
  price_multiplier: number;
}

interface Service {
  id: number;
  name: string;
  price: number;
  icon?: string;
}

// ─── Static defaults ──────────────────────────────────────────────────────────

const DEFAULT_TRANSFER_TYPES: TransferType[] = [
  { id: 1, value: 'individual', label: 'Индивидуальный', description: 'Только для вас', icon: 'User' },
  { id: 2, value: 'group', label: 'Групповой', description: '1 500 ₽ с человека', icon: 'Users' },
];

const DEFAULT_CAR_CLASSES: CarClass[] = [
  { id: 1, value: 'economy',  label: 'Эконом',  description: 'Лада, Hyundai',     price_multiplier: 1.0 },
  { id: 2, value: 'comfort',  label: 'Комфорт', description: 'Toyota, Kia',       price_multiplier: 1.3 },
  { id: 3, value: 'business', label: 'Бизнес',  description: 'Mercedes, BMW',     price_multiplier: 1.7 },
  { id: 4, value: 'minivan',  label: 'Минивэн', description: 'до 7 пассажиров',   price_multiplier: 1.5 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pluralPassenger = (n: number) =>
  n === 1 ? 'пассажир' : n >= 2 && n <= 4 ? 'пассажира' : 'пассажиров';

const fmt = (n: number) =>
  n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

/** Returns datetime string suitable for datetime-local min attribute */
const nowDatetimeLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// ─── Car class accent colors ──────────────────────────────────────────────────

const CLASS_ACCENT: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  economy:  { ring: 'ring-gray-400',   bg: 'bg-gray-100 dark:bg-gray-800',          text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-400' },
  comfort:  { ring: 'ring-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40',        text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  business: { ring: 'ring-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40',      text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  minivan:  { ring: 'ring-green-500',  bg: 'bg-green-50 dark:bg-green-950/40',      text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
};

// ─── Section label ────────────────────────────────────────────────────────────

const FieldLabel = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="text-sm font-semibold">{children}</span>
    {optional && <span className="text-xs text-muted-foreground">(необязательно)</span>}
  </div>
);

// ─── Payment option button ────────────────────────────────────────────────────

const PayOption = ({
  active,
  onClick,
  label,
  price,
  sub,
  green,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  price: string;
  sub: string;
  green?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[80px] text-center w-full ${
      active
        ? green
          ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
          : 'border-primary bg-primary/10'
        : 'border-border bg-white/40 dark:bg-white/5 hover:border-primary/40'
    }`}
  >
    <p className={`font-semibold text-xs leading-tight mb-1 ${active && green ? 'text-green-700 dark:text-green-400' : ''}`}>{label}</p>
    <p className={`text-lg font-bold leading-none ${active && green ? 'text-green-700 dark:text-green-400' : ''}`}>{price}</p>
    <p className={`text-[10px] mt-1 leading-tight ${active && green ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>{sub}</p>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [transferTypes, setTransferTypes] = useState<TransferType[]>(DEFAULT_TRANSFER_TYPES);
  const [carClasses, setCarClasses] = useState<CarClass[]>(DEFAULT_CAR_CLASSES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  const [transferType, setTransferType] = useState('individual');
  const [carClass, setCarClass] = useState('comfort');
  const [basePrice, setBasePrice] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

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

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadTariffs();
    loadTransferConfig();
    checkAuth();
    loadServices();
  }, []);

  const checkAuth = async () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setIsLoggedIn(true);
      const name = localStorage.getItem('user_name') || '';
      const phone = localStorage.getItem('user_phone') || '';
      setFormData(prev => ({ ...prev, passenger_name: name, passenger_phone: phone }));
      try {
        const r = await fetch(`${API_URLS.users}&action=profile`, {
          headers: { 'X-User-Id': userId },
        });
        const d = await r.json();
        if (d.user) setUserBalance(parseFloat(d.user.balance || 0));
      } catch { /* silent */ }
    }
  };

  const loadTariffs = async () => {
    try {
      const r = await fetch(`${API_URLS.tariffs}?active=true`);
      const data = await r.json();
      setTariffs(data.tariffs || []);
    } catch (e) {
      console.error('[BookingForm] loadTariffs error:', e);
    }
  };

  const loadTransferConfig = async () => {
    try {
      const [ttRes, ccRes] = await Promise.all([
        fetch(`${API_URLS.transferTypes}&active=true`),
        fetch(`${API_URLS.carClasses}&active=true`),
      ]);
      const ttData = await ttRes.json();
      const ccData = await ccRes.json();
      if (ttData.transfer_types?.length) setTransferTypes(ttData.transfer_types);
      if (ccData.car_classes?.length) setCarClasses(ccData.car_classes);
    } catch { /* use defaults */ }
  };

  const loadServices = async () => {
    try {
      const r = await fetch(`${API_URLS.services}&active=true`);
      const d = await r.json();
      setServices(d.services || []);
    } catch { /* silent */ }
  };

  const servicesTotal = selectedServices.reduce((sum, sid) => {
    const svc = services.find(s => s.id === sid);
    return sum + (svc ? svc.price : 0);
  }, 0);

  const toggleService = (sid: number) => {
    setSelectedServices(prev =>
      prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
    );
  };

  // ── Price calculation ─────────────────────────────────────────────────────

  const calcPrice = (
    base: number,
    cls: string,
    type: string,
    pCount?: number,
  ) => {
    if (type === 'group') {
      return Math.round(1500 * (pCount ?? parseInt(formData.passengers_count) ?? 1));
    }
    const multiplier = parseFloat(String(carClasses.find(c => c.value === cls)?.price_multiplier ?? 1));
    return Math.round(base * multiplier);
  };

  const totalPrice = formData.price + servicesTotal;
  const prepayAmount = Math.round(totalPrice * 0.3);
  const canPayByBalance = isLoggedIn && userBalance >= totalPrice && totalPrice > 0;

  // ── Field handlers ────────────────────────────────────────────────────────

  const handleTariffChange = (tariffId: string) => {
    const tariff = tariffs.find(t => t.id.toString() === tariffId);
    if (!tariff) return;
    setBasePrice(tariff.price);
    const price = calcPrice(tariff.price, carClass, transferType);
    setFormData(prev => ({
      ...prev,
      tariff_id: tariffId,
      to_location: tariff.city,
      price,
      payment_from_balance: false,
    }));
  };

  const handleCarClassChange = (cls: string) => {
    setCarClass(cls);
    const price = basePrice > 0 ? calcPrice(basePrice, cls, transferType) : 0;
    setFormData(prev => ({ ...prev, car_class: cls, price }));
  };

  const handleTransferTypeChange = (type: string) => {
    setTransferType(type);
    const price = basePrice > 0 ? calcPrice(basePrice, carClass, type) : 0;
    setFormData(prev => ({ ...prev, transfer_type: type, price }));
  };

  const handlePassengerCount = (delta: number) => {
    const current = parseInt(formData.passengers_count) || 1;
    const next = Math.max(1, Math.min(8, current + delta));
    const price = basePrice > 0 ? calcPrice(basePrice, carClass, transferType, next) : 0;
    setFormData(prev => ({ ...prev, passengers_count: next.toString(), price }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

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
          price: totalPrice,
          services: selectedServices,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (formData.payment_from_balance) {
          setUserBalance(prev => prev - formData.price);
        }
        if (data.payment_url) {
          window.location.href = data.payment_url;
          return;
        }
        setSuccessOrderId(data.order_id ?? data.id ?? null);
        setIsSuccessDialogOpen(true);
        // Reset form
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
        setTransferType('individual');
        setCarClass('comfort');
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось создать заявку',
        });
      }
    } catch (e) {
      console.error('[BookingForm] handleSubmit error:', e);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить заявку' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────

  const pCount = parseInt(formData.passengers_count) || 1;
  const selectedTariff = tariffs.find(t => t.id.toString() === formData.tariff_id);
  const selectedClass = carClasses.find(c => c.value === carClass);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="max-w-2xl mx-auto glass-effect border-white/40 shadow-2xl animate-scale-in">
        <CardContent className="p-4 sm:p-7">

          {/* ── Auth warning banner ── */}
          {!isLoggedIn && (
            <div className="mb-5 flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                <Icon name="LogIn" className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-tight">
                  Нужен аккаунт для заказа
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Войдите или зарегистрируйтесь бесплатно
                </p>
              </div>
              <Button
                size="sm"
                className="gradient-primary text-white flex-shrink-0 min-h-[36px]"
                onClick={() => navigate('/auth')}
              >
                Войти
              </Button>
            </div>
          )}

          {/* ── Balance banner ── */}
          {isLoggedIn && userBalance > 0 && (
            <div className="mb-5 flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-2">
                <Icon name="Wallet" className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Ваш баланс</span>
              </div>
              <Badge className="bg-green-500 text-white font-semibold">
                {fmt(userBalance)} ₽
              </Badge>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ══════════════════════════════════
                STEP 1 — Transfer type toggle
            ══════════════════════════════════ */}
            <div>
              <FieldLabel>Тип трансфера</FieldLabel>
              {/* Mobile: horizontal scroll row. Desktop: auto grid based on count */}
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth -mx-1 px-1 sm:overflow-visible sm:grid sm:pb-0"
                style={{ gridTemplateColumns: transferTypes.length <= 2 ? `repeat(${transferTypes.length}, 1fr)` : transferTypes.length === 3 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)' } as React.CSSProperties}
              >
                {transferTypes.map(type => {
                  const active = transferType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTransferTypeChange(type.value)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-center min-h-[88px] min-w-[120px] max-w-[160px] flex-shrink-0 snap-start sm:min-w-0 sm:max-w-none sm:flex-shrink sm:flex-1 ${
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-white/40 dark:bg-white/5 hover:border-primary/40'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          active ? 'gradient-primary' : 'bg-muted'
                        }`}
                      >
                        <Icon
                          name={type.icon as Parameters<typeof Icon>[0]['name']}
                          className={`h-4 w-4 ${active ? 'text-white' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="font-semibold text-sm leading-tight">{type.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 2 — Route
            ══════════════════════════════════ */}
            <div className="space-y-3">
              <FieldLabel>Маршрут</FieldLabel>
              <div className="grid gap-3">
                {/* From */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Откуда</label>
                  <div className="relative">
                    <Icon name="MapPin" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                    <Input
                      value={formData.from_location}
                      onChange={e => setFormData(prev => ({ ...prev, from_location: e.target.value }))}
                      className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                      placeholder="Аэропорт Сочи"
                      required
                    />
                  </div>
                </div>

                {/* To — tariff select */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Куда</label>
                  <div className="relative">
                    <Icon name="Navigation" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none z-10" />
                    <Select value={formData.tariff_id} onValueChange={handleTariffChange} required>
                      <SelectTrigger className="pl-9 h-11 bg-white/50 dark:bg-white/5">
                        <SelectValue placeholder="Выберите город назначения" />
                      </SelectTrigger>
                      <SelectContent>
                        {tariffs.length === 0 && (
                          <SelectItem value="__loading" disabled>
                            Загрузка направлений...
                          </SelectItem>
                        )}
                        {tariffs.map(tariff => (
                          <SelectItem key={tariff.id} value={tariff.id.toString()}>
                            <span className="flex items-center justify-between w-full gap-4">
                              <span>{tariff.city}</span>
                              <span className="text-muted-foreground text-xs ml-auto">от {fmt(tariff.price)} ₽</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 3 — Car class 2×2 grid
            ══════════════════════════════════ */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Класс автомобиля</FieldLabel>
                {selectedClass && basePrice > 0 && transferType !== 'group' && (
                  <span className="text-xs text-muted-foreground">
                    ×{parseFloat(String(selectedClass.price_multiplier)).toFixed(1)} от базовой цены
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {carClasses.map(cls => {
                  const active = carClass === cls.value;
                  const accent = CLASS_ACCENT[cls.value] ?? CLASS_ACCENT.economy;
                  const clsPrice = basePrice > 0 && transferType !== 'group'
                    ? Math.round(basePrice * parseFloat(String(cls.price_multiplier)))
                    : null;
                  return (
                    <button
                      key={cls.value}
                      type="button"
                      onClick={() => handleCarClassChange(cls.value)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all min-h-[72px] ${
                        active
                          ? `border-primary bg-primary/10 ring-2 ring-offset-1 ${accent.ring}`
                          : 'border-border bg-white/40 dark:bg-white/5 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${accent.dot}`} />
                        <p className="font-semibold text-sm leading-none">{cls.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight">{cls.description}</p>
                      {clsPrice !== null && (
                        <p className={`text-xs font-bold mt-1.5 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                          {fmt(clsPrice)} ₽
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 4 — Date / flight
            ══════════════════════════════════ */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-2">Дата и время</label>
                <div className="relative">
                  <Icon name="Calendar" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="datetime-local"
                    value={formData.pickup_datetime}
                    min={nowDatetimeLocal()}
                    onChange={e => setFormData(prev => ({ ...prev, pickup_datetime: e.target.value }))}
                    className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">
                  Номер рейса <span className="text-xs font-normal text-muted-foreground">(необязательно)</span>
                </label>
                <div className="relative">
                  <Icon name="Plane" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="SU 1234"
                    value={formData.flight_number}
                    onChange={e => setFormData(prev => ({ ...prev, flight_number: e.target.value }))}
                    className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                  />
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 5 — Passenger count stepper
            ══════════════════════════════════ */}
            <div>
              <FieldLabel>Количество пассажиров</FieldLabel>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handlePassengerCount(-1)}
                  disabled={pCount <= 1}
                  className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center text-lg font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Уменьшить"
                >
                  <Icon name="Minus" className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold">{pCount}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{pluralPassenger(pCount)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePassengerCount(1)}
                  disabled={pCount >= 8}
                  className="w-11 h-11 rounded-xl border-2 border-border flex items-center justify-center text-lg font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Увеличить"
                >
                  <Icon name="Plus" className="h-5 w-5" />
                </button>
                {transferType === 'group' && (
                  <div className="flex-1 text-right">
                    <p className="text-xs text-muted-foreground">1 500 ₽ × {pCount}</p>
                    <p className="text-sm font-bold text-primary">{fmt(1500 * pCount)} ₽</p>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 6 — Contact info
            ══════════════════════════════════ */}
            <div>
              <FieldLabel>Контактные данные</FieldLabel>
              <div className="grid gap-3">
                {/* Name */}
                <div className="relative">
                  <Icon name="User" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Имя пассажира *"
                    value={formData.passenger_name}
                    onChange={e => setFormData(prev => ({ ...prev, passenger_name: e.target.value }))}
                    className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                    required
                  />
                </div>
                {/* Phone + Email */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Icon name="Phone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="tel"
                      placeholder="+7 (999) 000-00-00 *"
                      value={formData.passenger_phone}
                      onChange={e => setFormData(prev => ({ ...prev, passenger_phone: e.target.value }))}
                      className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Icon name="Mail" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.passenger_email}
                      onChange={e => setFormData(prev => ({ ...prev, passenger_email: e.target.value }))}
                      className="pl-9 h-11 bg-white/50 dark:bg-white/5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                STEP 7 — Additional services
            ══════════════════════════════════ */}
            {services.length > 0 && (
              <div>
                <FieldLabel optional>Дополнительные услуги</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map(svc => {
                    const active = selectedServices.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-white/40 dark:bg-white/5 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            name={(svc.icon as Parameters<typeof Icon>[0]['name']) || 'Star'}
                            fallback="Star"
                            className={`h-4 w-4 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                          <p className={`text-xs font-semibold leading-tight ${active ? 'text-primary' : ''}`}>{svc.name}</p>
                        </div>
                        <p className={`text-xs font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>+{fmt(svc.price)} ₽</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════
                PRICE CARD + PAYMENT
            ══════════════════════════════════ */}
            {formData.price > 0 && (
              <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 overflow-hidden">
                {/* Price summary */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Итоговая стоимость</p>
                      <div className="text-4xl font-extrabold text-gradient leading-none">
                        {fmt(totalPrice)} ₽
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">за весь автомобиль</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon name="Receipt" className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-1 text-xs text-muted-foreground border-t border-primary/15 pt-3">
                    {selectedTariff && (
                      <div className="flex justify-between">
                        <span>Базовая цена ({selectedTariff.city})</span>
                        <span>{fmt(selectedTariff.price)} ₽</span>
                      </div>
                    )}
                    {transferType !== 'group' && selectedClass && (
                      <div className="flex justify-between">
                        <span>Класс «{selectedClass.label}»</span>
                        <span>×{parseFloat(String(selectedClass.price_multiplier)).toFixed(1)}</span>
                      </div>
                    )}
                    {transferType === 'group' && (
                      <div className="flex justify-between">
                        <span>Групповой тариф</span>
                        <span>1 500 ₽ × {pCount} чел.</span>
                      </div>
                    )}
                    {servicesTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Доп. услуги ({selectedServices.length})</span>
                        <span>+{fmt(servicesTotal)} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-foreground border-t border-primary/15 pt-1 mt-1">
                      <span>Итого</span>
                      <span>{fmt(totalPrice)} ₽</span>
                    </div>
                  </div>
                </div>

                {/* Payment options */}
                <div className="border-t border-primary/15 bg-white/30 dark:bg-white/5 p-4 sm:p-5">
                  <p className="text-sm font-semibold mb-3">Способ оплаты</p>
                  <div className={`grid gap-2 ${canPayByBalance ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-3'}`}>
                    <PayOption
                      active={formData.payment_type === 'cash' && !formData.payment_from_balance}
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'cash', payment_from_balance: false }))}
                      label="Наличные"
                      price={`${fmt(totalPrice)} ₽`}
                      sub="при посадке"
                    />
                    <PayOption
                      active={formData.payment_type === 'full' && !formData.payment_from_balance}
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'full', payment_from_balance: false }))}
                      label="Онлайн"
                      price={`${fmt(totalPrice)} ₽`}
                      sub="картой сейчас"
                    />
                    <PayOption
                      active={formData.payment_type === 'prepay' && !formData.payment_from_balance}
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: 'prepay', payment_from_balance: false }))}
                      label="Предоплата 30%"
                      price={`${fmt(prepayAmount)} ₽`}
                      sub={`+${fmt(totalPrice - prepayAmount)} ₽ при посадке`}
                    />
                    {canPayByBalance && (
                      <PayOption
                        active={formData.payment_from_balance}
                        onClick={() => setFormData(prev => ({ ...prev, payment_type: 'full', payment_from_balance: true }))}
                        label="С баланса"
                        price={`${fmt(totalPrice)} ₽`}
                        sub={`Остаток: ${fmt(userBalance - totalPrice)} ₽`}
                        green
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Submit button — sticky on mobile ── */}
            <div className="sticky bottom-0 left-0 right-0 z-20 pb-2 pt-2 -mx-4 px-4 sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 bg-white/90 dark:bg-background/90 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:dark:bg-transparent border-t border-border/50 sm:border-0">
              <Button
                type="submit"
                size="lg"
                className="w-full gradient-primary text-white font-semibold text-base min-h-[54px] hover:opacity-95 transition-opacity shadow-lg sm:shadow-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                    Отправка...
                  </>
                ) : isLoggedIn ? (
                  <>
                    <Icon name="Send" className="mr-2 h-5 w-5" />
                    Отправить заявку
                    {totalPrice > 0 && (
                      <span className="ml-2 opacity-80 text-sm">· {fmt(totalPrice)} ₽</span>
                    )}
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" className="mr-2 h-5 w-5" />
                    Войти и заказать
                  </>
                )}
              </Button>

              {/* Required fields note */}
              <p className="text-center text-xs text-muted-foreground mt-2 sm:mt-0 sm:-mt-3">
                * обязательные поля
              </p>
            </div>

          </form>
        </CardContent>
      </Card>

      {/* ── Success dialog ── */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-4 pt-2">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                <Icon name="CheckCircle2" className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Заявка принята!
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-3 pb-2">
            {successOrderId && (
              <div className="inline-flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-sm">
                <Icon name="Hash" className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono font-semibold">Заказ #{successOrderId}</span>
              </div>
            )}
            <p className="text-muted-foreground text-sm leading-relaxed">
              Менеджер свяжется с вами в ближайшее время для подтверждения трансфера.
              Следите за статусом в личном кабинете.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setIsSuccessDialogOpen(false)}
              >
                Закрыть
              </Button>
              <Button
                className="gradient-primary text-white min-h-[44px]"
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  navigate('/profile');
                }}
              >
                <Icon name="List" className="mr-1.5 h-4 w-4" />
                Мои заказы
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;