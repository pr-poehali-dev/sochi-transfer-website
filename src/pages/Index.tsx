import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import BookingForm from '@/components/BookingForm';
import { API_URLS } from '@/config/api';

const Index = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSent, setChatSent] = useState(false);

  const [tariffs, setTariffs] = useState<Record<string, unknown>[]>([]);
  const [fleet, setFleet] = useState<Record<string, unknown>[]>([]);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [news, setNews] = useState<Record<string, unknown>[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author_name: '', rating: 5, text: '' });
  const [reviewSending, setReviewSending] = useState(false);

  const isLoggedIn = !!localStorage.getItem('user_id');
  const isDriverLoggedIn = !!localStorage.getItem('driver_id');

  useEffect(() => {
    loadAll();
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const id = settings['yandex_metrika_id'];
    if (id && typeof window !== 'undefined' && !document.getElementById('ym-script')) {
      const script = document.createElement('script');
      script.id = 'ym-script';
      script.innerHTML = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`;
      document.head.appendChild(script);
    }
  }, [settings]);

  const loadAll = async () => {
    const safe = async (url: string) => {
      try { const r = await fetch(url); return await r.json(); } catch { return {}; }
    };
    const [td, fd, rd, nd, sd] = await Promise.all([
      safe(`${API_URLS.tariffs}?active=true`),
      safe(`${API_URLS.fleet}?active=true`),
      safe(`${API_URLS.reviews}&action=approved`),
      safe(API_URLS.news),
      safe(API_URLS.settings),
    ]);
    setTariffs(td.tariffs || []);
    setFleet(fd.fleet || []);
    setReviews(rd.reviews || []);
    setNews(nd.news || []);
    setSettings(sd.settings || {});
  };

  const submitReview = async () => {
    if (!reviewForm.text.trim()) return;
    setReviewSending(true);
    try {
      const userId = localStorage.getItem('user_id');
      await fetch(API_URLS.reviews, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          author_name: reviewForm.author_name || localStorage.getItem('user_name') || 'Аноним',
          user_id: userId ? Number(userId) : null,
          type: 'service'
        })
      });
      setReviewOpen(false);
      setReviewForm({ author_name: '', rating: 5, text: '' });
      alert('Спасибо! Ваш отзыв отправлен на модерацию.');
    } catch { /* silent */ }
    finally { setReviewSending(false); }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    const wa = settings['whatsapp_number'];
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(chatMessage)}`, '_blank');
    }
    setChatSent(true);
    setChatMessage('');
  };

  // ── Derived settings ──────────────────────────────────────────────────────
  const whatsappUrl   = settings['whatsapp_number']   ? `https://wa.me/${settings['whatsapp_number']}` : 'https://wa.me/79000000000';
  const telegramUrl   = settings['telegram_username'] ? `https://t.me/${settings['telegram_username']}` : '#';
  const telegramGroupUrl = settings['telegram_group_url'] || settings['site_telegram_url'] || '';
  const viberUrl      = settings['viber_number']      ? `viber://chat?number=${settings['viber_number']}` : '#';
  const vkUrl         = settings['vk_url']            || '#';
  const instagramUrl  = settings['instagram_url']     || '#';
  const youtubeUrl    = settings['youtube_url']       || '#';
  const tiktokUrl     = settings['tiktok_url']        || '#';
  const maxUrl        = settings['max_username']
    ? (settings['max_username'].startsWith('http') ? settings['max_username'] : `https://max.ru/${settings['max_username']}`)
    : '#';
  const phone       = settings['company_phone']   || '+7 (900) 000-00-00';
  const email       = settings['company_email']   || 'info@poehali.pro';
  const address     = settings['company_address'] || 'г. Сочи, Аэропорт';
  const heroBadge   = settings['hero_badge_text'] || 'Надежные трансферы с 2012 года';
  const heroDesc    = settings['hero_description']|| 'Комфортные поездки из аэропорта, вокзала и любой точки города.';
  const footerBrand  = settings['footer_brand']   || 'ПоехалиПро';
  const footerSlogan = settings['footer_slogan']  || 'Трансфер Абхазия-Россия';
  const siteYear    = settings['site_year']       || '2012';

  // Desktop nav sections (scroll-based)
  const navSections = ['Главная', 'Тарифы', 'Автопарк', 'О нас', 'Отзывы', 'Контакты'];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {settings['site_title'] && <title>{settings['site_title']}</title>}

      {/* ════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <button
              className="flex items-center gap-2 min-h-[44px]"
              onClick={() => scrollToSection('главная')}
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Icon name="Car" className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="text-lg font-bold text-gradient">ПоехалиПро</span>
                <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">{footerSlogan}</span>
              </div>
            </button>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-5">
              {navSections.map(item => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-all hover:text-primary ${activeSection === item.toLowerCase() ? 'text-primary' : 'text-foreground/70'}`}
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => navigate('/tariffs')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1"
              >
                <Icon name="Tag" className="h-3.5 w-3.5" />
                Тарифы
              </button>
              <button
                onClick={() => navigate('/rideshares')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1"
              >
                <Icon name="Users" className="h-3.5 w-3.5" />
                Попутчики
              </button>
              <button
                onClick={() => navigate('/news')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1"
              >
                <Icon name="Newspaper" className="h-3.5 w-3.5" />
                Новости
              </button>
              <button
                onClick={() => navigate('/become-driver')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1"
              >
                <Icon name="Car" className="h-3.5 w-3.5" />
                Водителям
              </button>
            </div>

            {/* Desktop right: messenger icons + auth */}
            <div className="hidden lg:flex items-center gap-2">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" title="WhatsApp">
                    <Icon name="MessageCircle" className="h-5 w-5 text-green-500" />
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" title="Telegram">
                    <Icon name="Send" className="h-5 w-5 text-blue-500" />
                  </Button>
                </a>
              )}
              {telegramGroupUrl && settings['telegram_group_show'] !== 'false' && (
                <a href={telegramGroupUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
                    <Icon name="Send" className="h-3.5 w-3.5" />
                    {settings['telegram_group_title'] || 'Группа'}
                  </Button>
                </a>
              )}
              {isLoggedIn ? (
                <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>
                  <Icon name="User" className="mr-1.5 h-4 w-4" />
                  Кабинет
                </Button>
              ) : (
                <Button size="sm" className="gradient-primary text-white" onClick={() => navigate('/auth')}>
                  Войти
                </Button>
              )}
            </div>

            {/* Mobile right: phone + messenger + hamburger */}
            <div className="flex lg:hidden items-center gap-1">
              {/* Phone button always visible on mobile */}
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary"
                aria-label="Позвонить"
              >
                <Icon name="Phone" className="h-5 w-5" />
              </a>
              {/* WhatsApp always visible on mobile if configured */}
              {settings['whatsapp_number'] && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-green-500"
                  aria-label="WhatsApp"
                >
                  <Icon name="MessageCircle" className="h-5 w-5" />
                </a>
              )}
              {/* Hamburger */}
              <button
                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileMenuOpen}
              >
                <Icon name={mobileMenuOpen ? 'X' : 'Menu'} className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile slide-down menu ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-md overflow-y-auto">
            <div className="px-4 py-4 space-y-1 max-w-lg mx-auto">

              {/* Section scroll links */}
              {navSections.map(item => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                >
                  <Icon
                    name={
                      item === 'Главная' ? 'Home'
                      : item === 'Тарифы' ? 'Tag'
                      : item === 'Автопарк' ? 'Car'
                      : item === 'О нас' ? 'Info'
                      : item === 'Отзывы' ? 'Star'
                      : 'Phone'
                    }
                    className="h-5 w-5 text-muted-foreground"
                  />
                  {item}
                </button>
              ))}

              {/* Divider */}
              <div className="h-px bg-border my-2" />

              {/* Page links */}
              <button
                onClick={() => { navigate('/tariffs'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
              >
                <Icon name="Tag" className="h-5 w-5 text-muted-foreground" />
                Все тарифы
              </button>
              <button
                onClick={() => { navigate('/rideshares'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
              >
                <Icon name="Users" className="h-5 w-5 text-muted-foreground" />
                Попутчики
              </button>
              <button
                onClick={() => { navigate('/news'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
              >
                <Icon name="Newspaper" className="h-5 w-5 text-muted-foreground" />
                Новости
              </button>
              <button
                onClick={() => { navigate('/become-driver'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
              >
                <Icon name="Car" className="h-5 w-5 text-primary" />
                <span>Стать водителем</span>
                <Badge className="ml-auto text-xs gradient-primary text-white border-0">Доход</Badge>
              </button>

              {/* Divider */}
              <div className="h-px bg-border my-2" />

              {/* Auth buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {isLoggedIn ? (
                  <Button
                    className="w-full min-h-[52px] text-base"
                    variant="outline"
                    onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  >
                    <Icon name="User" className="mr-2 h-5 w-5" />
                    Личный кабинет
                  </Button>
                ) : (
                  <Button
                    className="w-full gradient-primary text-white min-h-[52px] text-base font-semibold"
                    onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                  >
                    <Icon name="LogIn" className="mr-2 h-5 w-5" />
                    Войти / Зарегистрироваться
                  </Button>
                )}
                {isDriverLoggedIn ? (
                  <Button
                    className="w-full min-h-[52px] text-base"
                    variant="outline"
                    onClick={() => { navigate('/driver/cabinet'); setMobileMenuOpen(false); }}
                  >
                    <Icon name="Car" className="mr-2 h-5 w-5" />
                    Кабинет водителя
                  </Button>
                ) : (
                  <Button
                    className="w-full min-h-[48px]"
                    variant="outline"
                    onClick={() => { navigate('/driver/register'); setMobileMenuOpen(false); }}
                  >
                    <Icon name="UserPlus" className="mr-2 h-4 w-4" />
                    Стать водителем
                  </Button>
                )}
              </div>

              {/* Messenger buttons */}
              <div className="pt-2 pb-4">
                <p className="text-xs text-muted-foreground mb-3 px-1">Написать нам:</p>
                <div className="flex gap-2 flex-wrap">
                  {settings['whatsapp_number'] && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[48px] border-green-300 text-green-600 hover:bg-green-50">
                        <Icon name="MessageCircle" className="mr-2 h-5 w-5" />WhatsApp
                      </Button>
                    </a>
                  )}
                  {settings['telegram_username'] && (
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[48px] border-blue-300 text-blue-600 hover:bg-blue-50">
                        <Icon name="Send" className="mr-2 h-5 w-5" />Telegram
                      </Button>
                    </a>
                  )}
                  {settings['max_username'] && maxUrl !== '#' && (
                    <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="min-h-[48px] min-w-[48px]">
                        <Icon name="Share2" className="h-5 w-5 text-blue-600" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section id="главная" className="relative pt-20 md:pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            {/* Badge */}
            <Badge className="mb-4 md:mb-6 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm gradient-primary text-white border-0">
              {heroBadge}
            </Badge>

            {/* Headline — compact on mobile */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              Трансфер в <span className="text-gradient">Сочи</span> и <span className="text-gradient">Абхазию</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto px-2">
              {heroDesc}
            </p>

            {/* Mobile CTA strip above form */}
            <div className="flex sm:hidden items-center justify-center gap-3 mb-5">
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex-1">
                <Button size="lg" className="w-full min-h-[52px] gradient-primary text-white text-base font-semibold">
                  <Icon name="Phone" className="mr-2 h-5 w-5" />
                  Позвонить
                </Button>
              </a>
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full min-h-[52px] border-green-400 text-green-600 text-base">
                    <Icon name="MessageCircle" className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                </a>
              )}
            </div>

            {/* Booking form - full width on mobile */}
            <div id="booking">
              <BookingForm />
            </div>

            {/* Trust chips */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mt-10 md:mt-12 max-w-2xl mx-auto">
              {[
                { icon: 'Shield', title: 'Безопасность', desc: 'Опытные водители' },
                { icon: 'Clock',  title: 'Пунктуальность', desc: 'Встречаем вовремя' },
                { icon: 'Star',   title: 'Качество', desc: 'Комфортные авто' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 md:gap-3">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-full gradient-secondary flex items-center justify-center">
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-lg">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          BECOME DRIVER BANNER STRIP
      ════════════════════════════════════════════════ */}
      {!isDriverLoggedIn && (
        <section className="py-4 md:py-6 bg-gradient-to-r from-primary/8 to-secondary/8 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-4 md:p-5 rounded-2xl border border-primary/20 bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="Car" className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-semibold text-sm md:text-base leading-tight">Стать водителем ПоехалиПро</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Зарабатывайте от 60 000 ₽/мес на своём автомобиле</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  className="gradient-primary text-white flex-1 sm:flex-none min-h-[44px] font-semibold"
                  onClick={() => navigate('/become-driver')}
                >
                  Узнать подробнее
                  <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[44px]"
                  onClick={() => navigate('/driver/register')}
                >
                  Подать заявку
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          TARIFFS
      ════════════════════════════════════════════════ */}
      <section id="тарифы" className="py-14 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <Badge className="mb-3 md:mb-4 gradient-secondary text-white border-0">Тарифы</Badge>
            <h2 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4">Направления и цены</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Фиксированные цены без скрытых доплат. Цена не меняется в зависимости от трафика.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {tariffs.map((tariff, idx) => (
              <Card
                key={String(tariff.id)}
                className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <CardHeader className="text-center pb-3 md:pb-4">
                  {tariff.image_url ? (
                    <img src={String(tariff.image_url)} alt={String(tariff.city)} className="w-full h-28 md:h-32 object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="text-4xl md:text-6xl mb-3">{String(tariff.image_emoji || '🚗')}</div>
                  )}
                  <CardTitle className="text-lg md:text-2xl">{String(tariff.city)}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">из Аэропорта Сочи</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="text-center">
                    <div className="text-2xl md:text-4xl font-bold text-gradient mb-1">{String(tariff.price)} ₽</div>
                    <p className="text-xs md:text-sm text-muted-foreground">за автомобиль</p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t">
                    {tariff.distance && (
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Icon name="MapPin" className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>{String(tariff.distance)}</span>
                      </div>
                    )}
                    {tariff.duration && (
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Icon name="Clock" className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>~{String(tariff.duration)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full gradient-primary text-white min-h-[44px]"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Заказать
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View all tariffs link */}
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => navigate('/tariffs')}>
              <Icon name="Tag" className="mr-2 h-4 w-4" />
              Посмотреть все тарифы
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FLEET — 2-col grid on mobile
      ════════════════════════════════════════════════ */}
      <section id="автопарк" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <Badge className="mb-3 md:mb-4 gradient-primary text-white border-0">Автопарк</Badge>
            <h2 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4">Наш автопарк</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Современные автомобили для вашего комфорта
            </p>
          </div>

          {/* 2-column on mobile, 3-column on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
            {fleet.map((car, idx) => (
              <Card
                key={String(car.id)}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <CardHeader className="text-center p-3 md:p-6">
                  {car.image_url ? (
                    <img
                      src={String(car.image_url)}
                      alt={String(car.name)}
                      className="w-full h-28 md:h-40 object-cover rounded-lg mb-2 md:mb-3"
                    />
                  ) : (
                    <div className="text-4xl md:text-7xl mb-2 md:mb-4">{String(car.image_emoji || '🚗')}</div>
                  )}
                  <CardTitle className="text-sm md:text-xl mb-1 md:mb-2 leading-tight">{String(car.name)}</CardTitle>
                  <Badge className="gradient-secondary text-white border-0 text-[10px] md:text-xs">{String(car.type)}</Badge>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-2 md:space-y-4">
                  <div className="grid grid-cols-2 gap-1.5 md:gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Icon name="Users" className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      <span>{String(car.capacity)} пасс.</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Icon name="Luggage" className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      <span>{String(car.luggage_capacity)} мест</span>
                    </div>
                  </div>
                  {/* Features — hidden on mobile to save space */}
                  <div className="hidden md:block pt-3 border-t space-y-2">
                    {(car.features as string[]).slice(0, 3).map((feature: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-2 text-sm">
                        <Icon name="CheckCircle2" className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full min-h-[40px] md:min-h-[44px] text-xs md:text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Выбрать авто
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RIDESHARES PROMO
      ════════════════════════════════════════════════ */}
      <section id="попутчики" className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20 overflow-hidden">
              <CardContent className="p-5 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <Badge className="mb-3 md:mb-4 gradient-primary text-white border-0">Сервис</Badge>
                    <h2 className="text-xl md:text-4xl font-bold mb-3 md:mb-4">Едем вместе — дешевле!</h2>
                    <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6">
                      Раздели стоимость трансфера с другими пассажирами. Находи попутчиков из аэропорта Сочи в Абхазию.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button className="gradient-primary text-white min-h-[48px]" onClick={() => navigate('/rideshares')}>
                        <Icon name="Users" className="mr-2 h-4 w-4" />
                        Найти попутчиков
                      </Button>
                      <Button variant="outline" className="min-h-[48px]" onClick={() => navigate('/rideshares')}>
                        <Icon name="Plus" className="mr-2 h-4 w-4" />
                        Предложить поездку
                      </Button>
                    </div>
                  </div>
                  <div className="text-5xl md:text-8xl">🚕</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          ABOUT
      ════════════════════════════════════════════════ */}
      <section id="о нас" className="py-14 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <Badge className="mb-3 md:mb-4 gradient-secondary text-white border-0">О нас</Badge>
              <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">Почему выбирают нас</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
              {[
                { icon: 'Award',      title: `Работаем с ${siteYear} года`, desc: 'Более 50 000 довольных клиентов и тысячи положительных отзывов' },
                { icon: 'Shield',     title: 'Гарантия безопасности',       desc: 'Все водители с многолетним опытом, автомобили застрахованы' },
                { icon: 'Clock',      title: 'Работаем 24/7',               desc: 'Круглосуточная служба поддержки и диспетчерская' },
                { icon: 'DollarSign', title: 'Честные цены',                desc: 'Фиксированная стоимость, без скрытых доплат и комиссий' },
              ].map((item, idx) => (
                <Card key={idx} className="glass-effect border-white/40 hover:shadow-xl transition-all">
                  <CardContent className="p-4 md:p-6 flex gap-3 md:gap-4">
                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2">{item.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          REVIEWS — simple grid, works on mobile
      ════════════════════════════════════════════════ */}
      <section id="отзывы" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <Badge className="mb-3 md:mb-4 gradient-primary text-white border-0">Отзывы</Badge>
            <h2 className="text-2xl md:text-5xl font-bold mb-4">Что говорят клиенты</h2>
          </div>

          {reviews.length > 0 ? (
            /* Mobile: 1 col, sm: 2 col, lg: 3 col */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
              {reviews.slice(0, 6).map((r, idx) => (
                <Card
                  key={String(r.id)}
                  className="hover:shadow-lg transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {String(r.author_name || 'А').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">{String(r.author_name || 'Аноним')}</p>
                          {r.source && r.source !== 'site' && (
                            <p className="text-xs text-muted-foreground">{String(r.source)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon
                            key={i}
                            name="Star"
                            className={`h-3.5 w-3.5 ${i < Number(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{String(r.text)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Будьте первым, кто оставит отзыв!</p>
          )}

          {/* Leave review CTA */}
          <div className="text-center mt-8">
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary text-white min-h-[52px]">
                  <Icon name="Star" className="mr-2 h-5 w-5" />
                  Оставить отзыв
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-3 rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Ваш отзыв о сервисе</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-1">
                  <div>
                    <Label className="text-sm mb-1.5 block">Ваше имя</Label>
                    <Input
                      placeholder="Как вас зовут?"
                      value={reviewForm.author_name}
                      onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Оценка</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                          className={`text-3xl transition-transform hover:scale-110 active:scale-95 ${n <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Ваш отзыв</Label>
                    <Textarea
                      placeholder="Расскажите о вашем опыте..."
                      rows={4}
                      value={reviewForm.text}
                      onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full gradient-primary text-white min-h-[48px]"
                    onClick={submitReview}
                    disabled={reviewSending || !reviewForm.text.trim()}
                  >
                    {reviewSending && <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />}
                    Отправить отзыв
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Отзыв появится после проверки модератором</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          NEWS
      ════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="py-10 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-10">
              <Badge className="mb-3 md:mb-4 gradient-secondary text-white border-0">Новости</Badge>
              <h2 className="text-2xl md:text-3xl font-bold">Последние новости</h2>
            </div>
            {/* 1 col on mobile, 2 on sm, 3 on md */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {news.slice(0, 3).map(n => (
                <Card
                  key={String(n.id)}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate('/news')}
                >
                  {n.image_url && (
                    <img
                      src={String(n.image_url)}
                      alt={String(n.title)}
                      className="w-full h-36 md:h-40 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="p-4">
                    <p className="font-semibold mb-2 line-clamp-2 text-sm md:text-base group-hover:text-primary transition-colors">
                      {String(n.title)}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">{String(n.content)}</p>
                    {n.published_at && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Icon name="Calendar" className="h-3 w-3" />
                        {new Date(String(n.published_at)).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => navigate('/news')}>
                <Icon name="Newspaper" className="mr-2 h-4 w-4" />
                Все новости
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          CONTACTS
      ════════════════════════════════════════════════ */}
      <section id="контакты" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-3 md:mb-4 gradient-primary text-white border-0">Контакты</Badge>
            <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">Свяжитесь с нами</h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-8 md:mb-10">
              Ответим на все вопросы и поможем с бронированием
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
              {[
                { icon: 'Phone',  title: 'Телефон', value: phone,   link: `tel:${phone.replace(/\D/g, '')}` },
                { icon: 'Mail',   title: 'Email',   value: email,   link: `mailto:${email}` },
                { icon: 'MapPin', title: 'Адрес',   value: address, link: '#' },
              ].map((contact, idx) => (
                <a
                  key={idx}
                  href={contact.link}
                  className="block p-4 md:p-6 rounded-xl glass-effect border border-white/40 hover:shadow-xl transition-all hover:-translate-y-0.5 min-h-[80px]"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Icon name={contact.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1 text-xs md:text-base">{contact.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground break-all">{contact.value}</p>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white min-h-[48px]">
                    <Icon name="MessageCircle" className="mr-2 h-5 w-5" />WhatsApp
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white min-h-[48px]">
                    <Icon name="Send" className="mr-2 h-5 w-5" />Telegram
                  </Button>
                </a>
              )}
              {settings['viber_number'] && (
                <a href={viberUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white min-h-[48px]">
                    <Icon name="Phone" className="mr-2 h-5 w-5" />Viber
                  </Button>
                </a>
              )}
              {settings['max_username'] && maxUrl !== '#' && (
                <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]">
                    <Icon name="Zap" className="mr-2 h-5 w-5" />MAX
                  </Button>
                </a>
              )}
              {settings['vk_url'] && vkUrl !== '#' && (
                <a href={vkUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white min-h-[48px]">
                    <Icon name="Share2" className="mr-2 h-5 w-5" />ВКонтакте
                  </Button>
                </a>
              )}
              {settings['instagram_url'] && instagramUrl !== '#' && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white min-h-[48px]">
                    <Icon name="Camera" className="mr-2 h-5 w-5" />Instagram
                  </Button>
                </a>
              )}
              {settings['youtube_url'] && youtubeUrl !== '#' && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white min-h-[48px]">
                    <Icon name="PlayCircle" className="mr-2 h-5 w-5" />YouTube
                  </Button>
                </a>
              )}
              {settings['tiktok_url'] && tiktokUrl !== '#' && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-gray-900 hover:bg-black text-white min-h-[48px]">
                    <Icon name="Music" className="mr-2 h-5 w-5" />TikTok
                  </Button>
                </a>
              )}
              {!settings['whatsapp_number'] && !settings['telegram_username'] && (
                <a href={`tel:${phone.replace(/\D/g, '')}`}>
                  <Button size="lg" className="gradient-primary text-white min-h-[48px]">
                    <Icon name="Phone" className="mr-2 h-5 w-5" />{phone}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER — stacked columns on mobile
      ════════════════════════════════════════════════ */}
      <footer className="py-8 md:py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          {/* Top row: logo + links + copyright stacked on mobile */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-4">

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base md:text-lg font-bold text-gradient">{footerBrand}</span>
                <span className="text-xs text-muted-foreground">{footerSlogan}</span>
              </div>
            </div>

            {/* Nav links — grid on mobile, flex on md */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <button className="hover:text-primary transition-colors text-left" onClick={() => scrollToSection('тарифы')}>Тарифы</button>
              <button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/tariffs')}>Все маршруты</button>
              <button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/rideshares')}>Попутчики</button>
              <button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/news')}>Новости</button>
              <button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/become-driver')}>Стать водителем</button>
              <button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/driver/register')}>Подать заявку</button>
              {settings['terms_of_service'] && (
                <button className="hover:text-primary transition-colors text-left" onClick={() => alert(settings['terms_of_service'])}>
                  Правила сервиса
                </button>
              )}
              {settings['privacy_policy'] && (
                <button className="hover:text-primary transition-colors text-left" onClick={() => alert(settings['privacy_policy'])}>
                  Конфиденциальность
                </button>
              )}
            </div>

            {/* Copyright */}
            <p className="text-xs md:text-sm text-muted-foreground text-center md:text-right">
              © {siteYear} {footerBrand}<br className="hidden md:block" />
              <span className="md:block"> Все права защищены.</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════
          SUPPORT CHAT BUBBLE
      ════════════════════════════════════════════════ */}
      {settings['chat_enabled'] !== 'false' && (
        <>
          <button
            onClick={() => setChatOpen(v => !v)}
            className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            aria-label={chatOpen ? 'Закрыть чат' : 'Открыть чат поддержки'}
          >
            <Icon name={chatOpen ? 'X' : 'MessageSquare'} className="h-6 w-6 text-white" />
          </button>

          {chatOpen && (
            <div className="fixed bottom-24 right-3 md:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-sm bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="gradient-primary p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="Headphones" className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Поддержка</p>
                    <p className="text-white/70 text-xs">Обычно отвечаем за 5 минут</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {chatSent ? (
                  <div className="text-center py-6">
                    <Icon name="CheckCircle2" className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="font-medium">Сообщение отправлено!</p>
                    <p className="text-sm text-muted-foreground mt-1">Мы ответим вам в WhatsApp</p>
                    <Button
                      variant="outline"
                      className="mt-4 min-h-[44px]"
                      onClick={() => { setChatSent(false); setChatMessage(''); }}
                    >
                      Написать ещё
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm">
                      👋 Привет! Напишите ваш вопрос, и мы ответим в ближайшее время.
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ваш вопрос..."
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                        className="flex-1 h-11"
                      />
                      <Button className="gradient-primary text-white min-h-[44px]" onClick={handleChatSend}>
                        <Icon name="Send" className="h-4 w-4" />
                      </Button>
                    </div>
                    {settings['whatsapp_number'] && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full mt-2 min-h-[44px] text-green-600 border-green-300 hover:bg-green-50">
                          <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
                          Написать в WhatsApp
                        </Button>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;