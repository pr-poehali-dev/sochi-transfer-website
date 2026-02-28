import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  [key: string]: string;
}

// ─── Static fallback data ─────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: 'Banknote',
    title: 'Высокий доход',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    descKey: 'become_driver_benefit_earnings',
    descFallback: 'Зарабатывайте от 60 000 ₽ в месяц. Ставка зависит от класса автомобиля и количества выполненных заказов.',
  },
  {
    icon: 'CalendarClock',
    title: 'Гибкий график',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    descKey: 'become_driver_benefit_schedule',
    descFallback: 'Работайте когда удобно — утром, вечером или в выходные. Вы сами выбираете время и количество заказов.',
  },
  {
    icon: 'HeadphonesIcon',
    title: 'Поддержка 24/7',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    descKey: 'become_driver_benefit_support',
    descFallback: 'Персональный менеджер и круглосуточная служба поддержки помогут решить любой вопрос.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Страхование',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    descKey: 'become_driver_benefit_insurance',
    descFallback: 'Все поездки застрахованы. Ваша безопасность и безопасность пассажира — наш приоритет.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: 'UserPlus',
    title: 'Регистрация',
    desc: 'Заполните анкету водителя: личные данные, информация об автомобиле. Занимает 5 минут.',
  },
  {
    num: '02',
    icon: 'FileText',
    title: 'Загрузка документов',
    desc: 'Прикрепите фото паспорта, водительского удостоверения, СТС и полиса ОСАГО.',
  },
  {
    num: '03',
    icon: 'BadgeCheck',
    title: 'Проверка',
    desc: 'Менеджер проверит ваши данные в течение 24 часов и активирует профиль.',
  },
  {
    num: '04',
    icon: 'Rocket',
    title: 'Начните зарабатывать',
    desc: 'После активации профиля принимайте заказы и получайте деньги на баланс.',
  },
];

const REQUIREMENTS_FALLBACK = [
  'Водительское удостоверение категории B (стаж от 3 лет)',
  'Автомобиль не старше 10 лет в хорошем техническом состоянии',
  'Действующий полис ОСАГО',
  'Отсутствие серьёзных нарушений ПДД за последние 2 года',
  'Российское гражданство или разрешение на работу',
  'Смартфон с доступом в интернет',
];

const DOCUMENTS = [
  { icon: 'CreditCard', label: 'Паспорт гражданина РФ', desc: 'Разворот с фото и страница с пропиской' },
  { icon: 'Car', label: 'Водительское удостоверение', desc: 'Оба разворота, категория B обязательна' },
  { icon: 'FileText', label: 'СТС автомобиля', desc: 'Свидетельство о регистрации транспортного средства' },
  { icon: 'Shield', label: 'Полис ОСАГО', desc: 'Действующий страховой полис' },
];

const FAQ_FALLBACK = [
  {
    q: 'Сколько я буду зарабатывать?',
    a: 'Доход зависит от количества поездок и класса автомобиля. В среднем водители зарабатывают от 60 000 до 120 000 ₽ в месяц. Комиссия сервиса — от 15%.',
  },
  {
    q: 'Как и когда я получу деньги?',
    a: 'Деньги зачисляются на ваш баланс после каждой поездки. Вывести их можно в любой момент на карту или через СБП.',
  },
  {
    q: 'Какие требования к автомобилю?',
    a: 'Автомобиль должен быть не старше 10 лет, в исправном состоянии, чистый внутри и снаружи. Класс автомобиля влияет на стоимость поездок.',
  },
  {
    q: 'Сколько времени занимает проверка документов?',
    a: 'Проверка занимает до 24 часов в рабочие дни. После одобрения вы сразу можете принимать заказы.',
  },
];

// ─── FAQ item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[56px] hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm leading-snug">{q}</span>
        <Icon
          name="ChevronDown"
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Section heading ──────────────────────────────────────────────────────────

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center mb-8">
    <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
    {subtitle && <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl mx-auto">{subtitle}</p>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BecomeDriverPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(API_URLS.settings);
        const data = await r.json();
        setSettings(data.settings || {});
      } catch (e) {
        console.error('[BecomeDriverPage] Failed to load settings:', e);
      } finally {
        setLoadingSettings(false);
      }
    };
    load();
  }, []);

  // Helper: get setting with fallback
  const s = (key: string, fallback: string) =>
    settings[key] || fallback;

  // Dynamic requirements list (comma-separated or line-separated from settings)
  const requirementsRaw = settings['driver_requirement_list'];
  const requirements: string[] = requirementsRaw
    ? requirementsRaw.split(/\n|;/).map(r => r.trim()).filter(Boolean)
    : REQUIREMENTS_FALLBACK;

  // Dynamic FAQ
  const faqItems = FAQ_FALLBACK.map((item, i) => ({
    q: s(`become_driver_faq_q_${i + 1}`, item.q),
    a: s(`become_driver_faq_a_${i + 1}`, item.a),
  }));

  const commissionRate = s('driver_commission_rate', '15');
  const minCarAge = s('driver_requirement_car_age', '10');
  const minLicenseYears = s('driver_requirement_license_years', '3');

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
              onClick={() => navigate('/driver/register')}
            >
              <Icon name="UserPlus" className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Стать водителем</span>
              <span className="sm:hidden">Регистрация</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section className="py-14 sm:py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Icon name="Sparkles" className="h-4 w-4" />
            Открытый набор водителей
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            {s('become_driver_hero_title', 'Станьте водителем')}{' '}
            <span className="text-gradient">ПоехалиПро</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {s(
              'become_driver_hero_subtitle',
              `Работайте на себя, зарабатывайте больше. Комиссия сервиса — всего ${commissionRate}%. Выплаты без задержек.`
            )}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="gradient-primary text-white min-h-[52px] px-8 text-base font-semibold w-full sm:w-auto"
              onClick={() => navigate('/driver/register')}
            >
              <Icon name="Rocket" className="mr-2 h-5 w-5" />
              Зарегистрироваться
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-[52px] px-8 text-base w-full sm:w-auto"
              onClick={() => navigate('/driver/login')}
            >
              Уже водитель? Войти
            </Button>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" className="h-4 w-4 text-green-500" />
              Проверка за 24 часа
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Wallet" className="h-4 w-4 text-blue-500" />
              Выплаты без задержек
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="ShieldCheck" className="h-4 w-4 text-purple-500" />
              Все поездки застрахованы
            </span>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BENEFITS
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Почему выбирают нас"
            subtitle="Присоединяйтесь к команде водителей и получайте всё необходимое для комфортной работы"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map(b => (
              <Card key={b.title} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`w-11 h-11 rounded-xl ${b.bg} flex items-center justify-center mb-4`}>
                    <Icon name={b.icon as Parameters<typeof Icon>[0]['name']} className={`h-5 w-5 ${b.color}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {loadingSettings ? b.descFallback : s(b.descKey, b.descFallback)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            STEPS
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Как начать работу"
            subtitle="Всего 4 простых шага отделяют вас от первого заказа"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, idx) => {
              const titleKey = `become_driver_step${idx + 1}_title`;
              const descKey  = `become_driver_step${idx + 1}_desc`;
              const title = s(titleKey, step.title);
              const desc  = s(descKey, step.desc);
              return (
                <div key={step.num} className="relative">
                  <Card className="border border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 sm:flex-col sm:gap-3">
                        {/* Step number */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                            {step.num}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon name={step.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Connector line (lg only, not last) */}
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-5 -right-2 w-4 h-0.5 bg-border z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            REQUIREMENTS
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Requirements */}
            <div>
              <h2 className="text-2xl font-bold mb-2">Требования к водителю</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {s(
                  'driver_requirement_intro',
                  `Для работы необходим стаж вождения от ${minLicenseYears} лет и автомобиль не старше ${minCarAge} лет.`
                )}
              </p>
              <ul className="space-y-3">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="Check" className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm leading-snug">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-2xl font-bold mb-2">Необходимые документы</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Загрузите фотографии документов при регистрации. Принимаем фото хорошего качества.
              </p>
              <div className="space-y-3">
                {DOCUMENTS.map(doc => (
                  <div key={doc.label} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={doc.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{doc.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            EARNINGS HIGHLIGHT
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <div className="rounded-2xl gradient-primary p-6 sm:p-10 text-white text-center">
            <Icon name="TrendingUp" className="h-10 w-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {s('become_driver_earnings_title', 'Зарабатывайте больше с нами')}
            </h2>
            <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-6">
              {s(
                'become_driver_earnings_desc',
                `Комиссия сервиса — всего ${commissionRate}%. Остальное ваше. Выплаты на карту или СБП в любое время без ожидания.`
              )}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-white/15 rounded-xl p-3">
                <div className="text-xl font-bold">{commissionRate}%</div>
                <div className="text-xs text-white/70 mt-0.5">Комиссия</div>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <div className="text-xl font-bold">24ч</div>
                <div className="text-xs text-white/70 mt-0.5">Проверка</div>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <div className="text-xl font-bold">0 ₽</div>
                <div className="text-xs text-white/70 mt-0.5">Вступительный взнос</div>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold min-h-[52px] px-8 text-base"
              onClick={() => navigate('/driver/register')}
            >
              <Icon name="UserPlus" className="mr-2 h-5 w-5" />
              Начать зарабатывать
            </Button>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <SectionHeading
            title="Частые вопросы"
            subtitle="Ответы на самые популярные вопросы от водителей"
          />
          <div className="max-w-2xl mx-auto space-y-2">
            {faqItems.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Не нашли ответ?{' '}
            <a
              href={`tel:${s('contact_phone', '+7 (800) 000-00-00')}`}
              className="text-primary underline-offset-2 hover:underline font-medium"
            >
              Позвоните нам
            </a>
          </p>
        </section>

        {/* ══════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
              <Icon name="Car" className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Готовы начать?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8">
              {s(
                'become_driver_cta_subtitle',
                'Регистрация занимает 5 минут. После проверки документов вы сразу можете принимать заказы.'
              )}
            </p>

            {/* Two driver type registration buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button
                size="lg"
                className="gradient-primary text-white min-h-[52px] px-6 text-sm font-semibold w-full sm:w-auto"
                onClick={() => navigate('/driver/register?type=transfer')}
              >
                <Icon name="Car" className="mr-2 h-5 w-5" />
                Регистрация водителя трансфера
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[52px] px-6 text-sm font-semibold w-full sm:w-auto"
                onClick={() => navigate('/driver/register?type=rideshare')}
              >
                <Icon name="Users" className="mr-2 h-5 w-5" />
                Регистрация водителя попутчиков
              </Button>
            </div>

            {/* Telegram group button (shown only if setting is set) */}
            {settings['telegram_group_url'] && (
              <a
                href={settings['telegram_group_url']}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors mb-4 w-full sm:w-auto"
              >
                <Icon name="Send" className="h-4 w-4 text-blue-500" />
                {settings['telegram_group_title'] || 'Вступить в группу Telegram'}
              </a>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              Нажимая кнопку, вы соглашаетесь с условиями оказания услуг
            </p>
          </div>
        </section>

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
        <p className="mt-1">
          {s('contact_phone', '')}
          {settings['contact_email'] && ` · ${settings['contact_email']}`}
        </p>
      </footer>
    </div>
  );
};

export default BecomeDriverPage;