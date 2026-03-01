import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tariff {
  id: number;
  city: string;
  price: number;
  description?: string;
}

interface CarClass {
  id: number;
  value: string;
  label: string;
  description: string;
  price_multiplier: number;
  icon?: string;
}

// ─── Static fallbacks ─────────────────────────────────────────────────────────

const DEFAULT_CAR_CLASSES: CarClass[] = [
  { id: 1, value: 'economy',  label: 'Эконом',  description: 'Лада, Hyundai, Kia',        price_multiplier: 1.0 },
  { id: 2, value: 'comfort',  label: 'Комфорт', description: 'Toyota, Skoda, Volkswagen',  price_multiplier: 1.3 },
  { id: 3, value: 'business', label: 'Бизнес',  description: 'Mercedes, BMW, Audi',        price_multiplier: 1.7 },
  { id: 4, value: 'minivan',  label: 'Минивэн', description: 'до 7 пассажиров',            price_multiplier: 1.5 },
];

const CLASS_COLORS: Record<string, { badge: string; dot: string; icon: string }> = {
  economy:  { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',   dot: 'bg-gray-400',   icon: 'Car' },
  comfort:  { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', dot: 'bg-blue-500',  icon: 'Car' },
  business: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', dot: 'bg-amber-500', icon: 'Crown' },
  minivan:  { badge: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300', dot: 'bg-green-500', icon: 'Users' },
};

const INCLUDED_ITEMS = [
  { icon: 'User',          text: 'Встреча с табличкой в аэропорту или на вокзале' },
  { icon: 'Luggage',       text: 'Помощь с погрузкой и разгрузкой багажа' },
  { icon: 'Wifi',          text: 'Бесплатный Wi-Fi в салоне автомобиля' },
  { icon: 'Droplets',      text: 'Бутилированная вода для каждого пассажира' },
  { icon: 'Clock',         text: 'Ожидание до 60 минут при задержке рейса' },
  { icon: 'ShieldCheck',   text: 'Страхование поездки' },
  { icon: 'CreditCard',    text: 'Оплата картой, наличными или онлайн' },
  { icon: 'Phone',         text: 'Поддержка водителя на протяжении всей поездки' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roundPrice = (price: number) => Math.round(price / 50) * 50;

const fmt = (n: number) =>
  n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeading = ({
  title,
  subtitle,
  className = '',
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) => (
  <div className={`text-center mb-8 ${className}`}>
    <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
    {subtitle && (
      <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const TariffsPage = () => {
  const navigate = useNavigate();

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [carClasses, setCarClasses] = useState<CarClass[]>(DEFAULT_CAR_CLASSES);
  const [loading, setLoading] = useState(true);

  // Calculator state
  const [calcTariffId, setCalcTariffId] = useState<number | ''>('');
  const [calcClassValue, setCalcClassValue] = useState('comfort');

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API_URLS.tariffs}?active=true`),
          fetch(`${API_URLS.carClasses}&active=true`),
        ]);
        const tData = await tRes.json();
        const cData = await cRes.json();

        const loadedTariffs: Tariff[] = tData.tariffs || [];
        const loadedClasses: CarClass[] = cData.car_classes || [];

        setTariffs(loadedTariffs);
        if (loadedClasses.length > 0) setCarClasses(loadedClasses);

        // Default calculator selection
        if (loadedTariffs.length > 0) setCalcTariffId(loadedTariffs[0].id);
      } catch (e) {
        console.error('[TariffsPage] load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calculator derived values
  const calcTariff = tariffs.find(t => t.id === calcTariffId) ?? tariffs[0] ?? null;
  const calcClass = carClasses.find(c => c.value === calcClassValue) ?? carClasses[0];
  const calcFinalPrice = calcTariff && calcClass
    ? roundPrice(calcTariff.price * parseFloat(String(calcClass.price_multiplier)))
    : null;

  // Book CTA — navigate home and scroll to booking form
  const handleBook = (tariff?: Tariff) => {
    const params = tariff ? `?city=${encodeURIComponent(tariff.city)}` : '';
    navigate(`/${params}`);
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-2 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">ПоехалиПро</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] text-muted-foreground"
              onClick={() => navigate('/')}
            >
              <Icon name="ArrowLeft" className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
            <Button
              size="sm"
              className="gradient-primary text-white min-h-[40px] px-4"
              onClick={() => handleBook()}
            >
              Забронировать
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section className="py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Icon name="Tag" className="h-4 w-4" />
            Актуальные цены на 2026 год
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            Тарифы{' '}
            <span className="text-gradient">ПоехалиПро</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Трансфер с фиксированной ценой или поездка попутчиком — выберите удобный формат.
          </p>
        </section>

        {/* ══════════════════════════════════════════
            TAB SWITCHER
        ══════════════════════════════════════════ */}
        <Tabs defaultValue="transfer" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="h-12 p-1 bg-muted rounded-xl gap-1">
              <TabsTrigger
                value="transfer"
                className="h-10 px-6 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
              >
                <Icon name="Car" className="h-4 w-4" />
                Трансфер
              </TabsTrigger>
              <TabsTrigger
                value="rideshare"
                className="h-10 px-6 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
              >
                <Icon name="Users" className="h-4 w-4" />
                Попутчики
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══ TAB: Transfer ══ */}
          <TabsContent value="transfer" className="mt-0">

        {/* ══════════════════════════════════════════
            CAR CLASS BADGES
        ══════════════════════════════════════════ */}
        <section className="pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {carClasses.map(cls => {
              const colors = CLASS_COLORS[cls.value] ?? CLASS_COLORS.economy;
              return (
                <Card
                  key={cls.value}
                  className={`border transition-shadow hover:shadow-md ${
                    calcClassValue === cls.value ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-8 h-8 rounded-full ${colors.dot} flex items-center justify-center mx-auto mb-2`}>
                      <Icon name={colors.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-semibold text-sm">{cls.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{cls.description}</p>
                    <Badge className={`mt-2 text-[10px] ${colors.badge}`}>×{cls.price_multiplier.toFixed(1)}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            PRICE CALCULATOR
        ══════════════════════════════════════════ */}
        <section className="pb-12 border-t border-border pt-10">
          <SectionHeading
            title="Калькулятор стоимости"
            subtitle="Выберите направление и класс автомобиля — мы покажем итоговую цену"
          />

          <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-lg">
            <CardContent className="p-5 sm:p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Tariff selector */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    <Icon name="MapPin" className="inline h-3.5 w-3.5 mr-1 text-primary" />
                    Направление
                  </label>
                  {loading ? (
                    <div className="h-11 bg-muted animate-pulse rounded-lg" />
                  ) : tariffs.length === 0 ? (
                    <div className="h-11 flex items-center px-3 rounded-lg border border-border text-sm text-muted-foreground">
                      Тарифы не загружены
                    </div>
                  ) : (
                    <select
                      className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={calcTariffId}
                      onChange={e => setCalcTariffId(Number(e.target.value))}
                    >
                      {tariffs.map(t => (
                        <option key={t.id} value={t.id}>{t.city}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Car class selector */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    <Icon name="Car" className="inline h-3.5 w-3.5 mr-1 text-primary" />
                    Класс автомобиля
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={calcClassValue}
                    onChange={e => setCalcClassValue(e.target.value)}
                  >
                    {carClasses.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label} (×{c.price_multiplier.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result */}
              <div className="rounded-xl bg-muted/50 border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {calcTariff && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {calcTariff.city}
                      <span className="mx-2 text-border">·</span>
                      {calcClass?.label}
                      {calcClass && (
                        <span className="ml-1 text-xs">
                          (×{calcClass.price_multiplier.toFixed(1)})
                        </span>
                      )}
                    </p>
                  )}
                  <div className="text-4xl font-extrabold text-gradient leading-none">
                    {calcFinalPrice !== null ? `${fmt(calcFinalPrice)} ₽` : '—'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">за весь автомобиль · фиксированная цена</p>
                </div>
                <Button
                  size="lg"
                  className="gradient-primary text-white min-h-[48px] px-8 text-base font-semibold w-full sm:w-auto flex-shrink-0"
                  onClick={() => handleBook(calcTariff ?? undefined)}
                  disabled={!calcTariff}
                >
                  <Icon name="Calendar" className="mr-2 h-4 w-4" />
                  Забронировать
                </Button>
              </div>

              {/* Breakdown hint */}
              {calcTariff && calcClass && calcFinalPrice !== null && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                  <div className="bg-muted/40 rounded-lg p-2">
                    <div className="font-semibold text-foreground">{fmt(calcTariff.price)} ₽</div>
                    <div>базовая цена</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2">
                    <div className="font-semibold text-foreground">×{calcClass.price_multiplier.toFixed(1)}</div>
                    <div>коэффициент</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                    <div className="font-bold text-primary">{fmt(calcFinalPrice)} ₽</div>
                    <div>итого</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ══════════════════════════════════════════
            TARIFF TABLE
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Все направления"
            subtitle="Цены для каждого класса автомобиля по всем маршрутам"
          />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : tariffs.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <Icon name="MapPin" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">Тарифы временно недоступны</p>
                <p className="text-xs text-muted-foreground mt-1">Свяжитесь с нами для уточнения цен</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="text-left px-5 py-3.5 font-semibold">Маршрут</th>
                      {carClasses.map(cls => {
                        const colors = CLASS_COLORS[cls.value] ?? CLASS_COLORS.economy;
                        return (
                          <th key={cls.value} className="text-right px-4 py-3.5 font-semibold whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {cls.label}
                            </span>
                          </th>
                        );
                      })}
                      <th className="text-right px-5 py-3.5 font-semibold">Бронь</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map((tariff, idx) => (
                      <tr
                        key={tariff.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                          idx % 2 === 0 ? '' : 'bg-muted/10'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">{tariff.city}</p>
                          {tariff.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{tariff.description}</p>
                          )}
                        </td>
                        {carClasses.map(cls => {
                          const price = roundPrice(tariff.price * cls.price_multiplier);
                          return (
                            <td key={cls.value} className="px-4 py-4 text-right">
                              <span className="font-semibold">{fmt(price)} ₽</span>
                            </td>
                          );
                        })}
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            className="gradient-primary text-white min-h-[36px]"
                            onClick={() => handleBook(tariff)}
                          >
                            Выбрать
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {tariffs.map(tariff => (
                  <Card key={tariff.id} className="border border-border">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <CardTitle className="text-base leading-tight">{tariff.city}</CardTitle>
                      {tariff.description && (
                        <p className="text-xs text-muted-foreground">{tariff.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {carClasses.map(cls => {
                          const price = roundPrice(tariff.price * cls.price_multiplier);
                          const colors = CLASS_COLORS[cls.value] ?? CLASS_COLORS.economy;
                          return (
                            <div key={cls.value} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                              <span className={`text-xs font-medium flex items-center gap-1.5 ${colors.badge.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                                {cls.label}
                              </span>
                              <span className="text-sm font-bold">{fmt(price)} ₽</span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        className="w-full gradient-primary text-white min-h-[44px]"
                        onClick={() => handleBook(tariff)}
                      >
                        <Icon name="Calendar" className="mr-2 h-4 w-4" />
                        Забронировать
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ══════════════════════════════════════════
            WHAT'S INCLUDED
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Что входит в стоимость"
            subtitle="Никаких скрытых доплат — всё включено в цену трансфера"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {INCLUDED_ITEMS.map(item => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            GROUP TRANSFERS
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Info */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-full px-3 py-1 text-sm font-medium mb-4">
                <Icon name="Users" className="h-4 w-4" />
                Групповые трансферы
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                Едете большой компанией?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                Для группы от 4 человек действует специальный тариф — <strong className="text-foreground">1 500 ₽ с каждого пассажира</strong>.
                Это выгоднее, чем заказывать несколько отдельных автомобилей.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Микроавтобус вместимостью до 7 пассажиров',
                  'Большой багажный отсек для чемоданов',
                  'Единый маршрут для всей группы',
                  'Встреча с табличкой и помощь с багажом',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="Check" className="h-3 w-3 text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="gradient-primary text-white min-h-[48px] px-8 font-semibold"
                onClick={() => handleBook()}
              >
                <Icon name="Calendar" className="mr-2 h-4 w-4" />
                Заказать групповой трансфер
              </Button>
            </div>

            {/* Price card */}
            <div>
              <Card className="border-2 border-green-200 dark:border-green-900 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                    <Icon name="Users" className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Групповой тариф</p>
                  <div className="text-5xl font-extrabold text-green-600 leading-none mb-1">
                    1 500 ₽
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">с одного пассажира</p>

                  <div className="space-y-2 text-sm text-left">
                    {[
                      { n: 2, price: 3000 },
                      { n: 3, price: 4500 },
                      { n: 4, price: 6000 },
                      { n: 5, price: 7500 },
                      { n: 6, price: 9000 },
                      { n: 7, price: 10500 },
                    ].map(row => (
                      <div
                        key={row.n}
                        className="flex justify-between items-center py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Icon name="User" className="h-3.5 w-3.5" />
                          {row.n} пассажира{row.n >= 5 ? 'ей' : row.n >= 2 ? '' : ''}
                        </span>
                        <span className="font-semibold">{fmt(row.price)} ₽</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    * Стоимость за весь маршрут, одно направление
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CLASS DESCRIPTIONS
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Классы автомобилей"
            subtitle="Подберите автомобиль под свои потребности и бюджет"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {carClasses.map(cls => {
              const colors = CLASS_COLORS[cls.value] ?? CLASS_COLORS.economy;
              const extras: Record<string, string[]> = {
                economy:  ['Кондиционер', 'Вода', 'Wi-Fi'],
                comfort:  ['Кондиционер', 'Вода', 'Wi-Fi', 'Просторный салон'],
                business: ['Климат-контроль', 'Вода', 'Wi-Fi', 'Кожаный салон', 'Бесшумный двигатель'],
                minivan:  ['Кондиционер', 'Вода', 'Wi-Fi', 'До 7 пассажиров', 'Большой багажник'],
              };
              const basePrice = tariffs.length > 0
                ? roundPrice(tariffs[0].price * cls.price_multiplier)
                : null;

              return (
                <Card key={cls.value} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.dot} flex items-center justify-center`}>
                          <Icon name={colors.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{cls.label}</p>
                          <p className="text-xs text-muted-foreground">{cls.description}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${colors.badge}`}>
                        ×{cls.price_multiplier.toFixed(1)}
                      </Badge>
                    </div>

                    {basePrice !== null && (
                      <p className="text-sm text-muted-foreground mb-3">
                        От <span className="font-semibold text-foreground">{fmt(basePrice)} ₽</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {(extras[cls.value] ?? []).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-full"
                        >
                          <Icon name="Check" className="h-2.5 w-2.5 text-green-500" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <div className="rounded-2xl gradient-primary p-7 sm:p-12 text-white text-center">
            <Icon name="MapPin" className="h-10 w-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Готовы к поездке?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-7">
              Забронируйте трансфер прямо сейчас. Мы назначим водителя и пришлём подтверждение в течение нескольких минут.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold min-h-[52px] px-10 text-base w-full sm:w-auto"
                onClick={() => handleBook()}
              >
                <Icon name="Calendar" className="mr-2 h-5 w-5" />
                Забронировать трансфер
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10 min-h-[52px] px-8 text-base w-full sm:w-auto"
                onClick={() => navigate('/become-driver')}
              >
                <Icon name="Car" className="mr-2 h-4 w-4" />
                Стать водителем
              </Button>
            </div>
          </div>
        </section>

          </TabsContent>

          {/* ══ TAB: Rideshare (Попутчики) ══ */}
          <TabsContent value="rideshare" className="mt-0">

            {/* Hero for rideshare */}
            <section className="py-8 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                <Icon name="Users" className="h-4 w-4" />
                Попутчики — экономная поездка
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight">
                Тарифы для{' '}
                <span className="text-gradient">попутчиков</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Цены устанавливает водитель — вы видите их до бронирования. Никаких скрытых платежей.
              </p>
            </section>

            {/* Price info card */}
            <section className="pb-10">
              <Card className="max-w-2xl mx-auto border-2 border-blue-200 dark:border-blue-900 shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                      <Icon name="Banknote" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">Цену назначает организатор</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Каждый водитель-попутчик сам устанавливает цену за место. Вы видите стоимость ещё до того, как записываетесь на поездку.
                      </p>
                    </div>
                  </div>

                  {/* Typical range */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Короткий маршрут', range: '200–600 ₽', sub: 'до 50 км', color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400' },
                      { label: 'Средний маршрут', range: '600–1 500 ₽', sub: '50–150 км', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400' },
                      { label: 'Длинный маршрут', range: 'от 1 500 ₽', sub: 'свыше 150 км', color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-400' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl border p-3 text-center ${item.color}`}>
                        <p className="text-xs font-medium leading-tight mb-1">{item.label}</p>
                        <p className="text-base font-bold leading-none">{item.range}</p>
                        <p className="text-[11px] mt-1 opacity-70">{item.sub}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center mb-6">
                    * Ориентировочные диапазоны цен. Точная стоимость — в карточке каждой поездки.
                  </p>

                  <Button
                    size="lg"
                    className="w-full gradient-primary text-white min-h-[52px] text-base font-semibold"
                    onClick={() => navigate('/passenger')}
                  >
                    <Icon name="Search" className="mr-2 h-5 w-5" />
                    Найти поездку попутчиком
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Benefits */}
            <section className="pb-10 border-t border-border pt-10">
              <SectionHeading
                title="Почему попутчики — это выгодно"
                subtitle="Делите расходы на дорогу и находите попутчиков по маршруту"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[
                  { icon: 'PiggyBank',   title: 'Экономия',         desc: 'Цена за место, а не за весь автомобиль — в 2–4 раза дешевле обычного такси' },
                  { icon: 'Users',       title: 'Новые знакомства', desc: 'Познакомьтесь с интересными людьми, которые едут в ту же сторону' },
                  { icon: 'Leaf',        title: 'Экология',         desc: 'Меньше машин на дороге — меньше выбросов. Ваш вклад в чистоту воздуха' },
                  { icon: 'Clock',       title: 'Удобное время',    desc: 'Выбирайте поездку по удобному расписанию или предложите свою' },
                  { icon: 'ShieldCheck', title: 'Безопасно',        desc: 'Все водители проходят проверку. Отмените бронирование в любой момент' },
                  { icon: 'MapPin',      title: 'Любые маршруты',   desc: 'Сочи, Абхазия, Краснодар — найдите поездку в нужном направлении' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How it works */}
            <section className="pb-10 border-t border-border pt-10">
              <SectionHeading title="Как это работает" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {[
                  { step: '1', icon: 'Search',      title: 'Найдите поездку',     desc: 'Просмотрите доступные поездки по вашему маршруту и выберите подходящую по времени и цене' },
                  { step: '2', icon: 'CheckCircle2', title: 'Забронируйте место',  desc: 'Укажите количество мест и подтвердите бронирование — водитель увидит вас в списке' },
                  { step: '3', icon: 'Car',          title: 'Отправляйтесь',       desc: 'Встретьтесь с водителем в условленном месте и наслаждайтесь поездкой' },
                ].map(item => (
                  <div key={item.step} className="flex flex-col items-center text-center p-5 rounded-xl border border-border bg-muted/10">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-3 text-white font-bold text-lg">
                      {item.step}
                    </div>
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 text-primary mb-2" />
                    <p className="font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Rideshare CTA */}
            <section className="pb-12">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-7 sm:p-10 text-white text-center">
                <Icon name="Users" className="h-10 w-10 mx-auto mb-4 opacity-90" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Едем вместе?</h2>
                <p className="text-white/80 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-7">
                  Найдите попутчика прямо сейчас или предложите свою поездку и разделите расходы на дорогу.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="bg-white text-blue-700 hover:bg-white/90 font-semibold min-h-[52px] px-8 text-base w-full sm:w-auto"
                    onClick={() => navigate('/passenger')}
                  >
                    <Icon name="Search" className="mr-2 h-5 w-5" />
                    Найти поездку
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10 min-h-[52px] px-8 text-base w-full sm:w-auto"
                    onClick={() => navigate('/driver/register')}
                  >
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    Предложить поездку
                  </Button>
                </div>
              </div>
            </section>

          </TabsContent>

        </Tabs>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-4 py-6 px-4 text-center text-xs text-muted-foreground">
        <button
          className="flex items-center gap-1.5 mx-auto mb-3"
          onClick={() => navigate('/')}
        >
          <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center">
            <Icon name="Car" className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-foreground">ПоехалиПро</span>
        </button>
        <p>Сервис трансферных перевозок</p>
      </footer>
    </div>
  );
};

export default TariffsPage;