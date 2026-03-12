import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import BookingForm from '@/components/BookingForm';
import AiAssistant from '@/components/AiAssistant';
import { API_URLS } from '@/config/api';

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const id = settings['yandex_metrika_id'];
    if (id && typeof window !== 'undefined' && !document.getElementById('ym-script')) {
      const script = document.createElement('script');
      script.id = 'ym-script';
      script.innerHTML = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`;
      document.head.appendChild(script);
    }
    const headScript = settings['custom_head_script'];
    if (headScript && !document.getElementById('custom-head-script')) {
      const div = document.createElement('div');
      div.id = 'custom-head-script';
      div.innerHTML = headScript;
      Array.from(div.children).forEach(el => document.head.appendChild(el));
    }
    const bodyScript = settings['custom_body_script'];
    if (bodyScript && !document.getElementById('custom-body-script')) {
      const div = document.createElement('div');
      div.id = 'custom-body-script';
      div.innerHTML = bodyScript;
      document.body.appendChild(div);
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

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const whatsappUrl = settings['whatsapp_number'] ? `https://wa.me/${settings['whatsapp_number']}` : 'https://wa.me/79000000000';
  const telegramUrl = settings['telegram_username'] ? `https://t.me/${settings['telegram_username']}` : '#';
  const telegramGroupUrl = settings['telegram_group_url'] || settings['site_telegram_url'] || '';
  const viberUrl = settings['viber_number'] ? `viber://chat?number=${settings['viber_number']}` : '#';
  const vkUrl = settings['vk_url'] || '#';
  const instagramUrl = settings['instagram_url'] || '#';
  const youtubeUrl = settings['youtube_url'] || '#';
  const tiktokUrl = settings['tiktok_url'] || '#';
  const maxUrl = settings['max_username']
    ? (settings['max_username'].startsWith('http') ? settings['max_username'] : `https://max.ru/${settings['max_username']}`)
    : '#';
  const phone = settings['company_phone'] || '+7 (900) 000-00-00';
  const email = settings['company_email'] || 'info@poehali.pro';
  const address = settings['company_address'] || 'г. Сочи, Аэропорт';
  const heroBadge = settings['hero_badge_text'] || 'Надежные трансферы с 2012 года';
  const heroDesc = settings['hero_description'] || 'Комфортные поездки из аэропорта, вокзала и любой точки города.';
  const footerBrand = settings['footer_brand'] || 'ПоехалиПро';
  const footerSlogan = settings['footer_slogan'] || 'Трансфер Абхазия-Россия';
  const siteYear = settings['site_year'] || '2012';

  const NAV_LINKS = [
    { label: 'Главная', id: 'главная', icon: 'Home' },
    { label: 'Тарифы', id: 'тарифы', icon: 'Tag' },
    { label: 'Автопарк', id: 'автопарк', icon: 'Car' },
    { label: 'Отзывы', id: 'отзывы', icon: 'Star' },
    { label: 'Контакты', id: 'контакты', icon: 'Phone' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {settings['site_title'] && <title>{settings['site_title']}</title>}

      {/* ══════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-sm border-b border-border' : 'bg-white/80 backdrop-blur-md border-b border-white/30'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button
              className="flex items-center gap-2.5 min-h-[44px] group"
              onClick={() => scrollTo('главная')}
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Icon name="Car" className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="text-base font-bold text-gradient">{footerBrand}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{footerSlogan}</span>
              </div>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/tariffs')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1"
              >
                Все маршруты
              </button>
              {settings['feature_rideshares'] !== 'false' && (
                <button
                  onClick={() => navigate('/rideshares')}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  Попутчики
                </button>
              )}
              <button
                onClick={() => navigate('/news')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all"
              >
                Новости
              </button>
            </div>

            {/* Desktop right */}
            <div className="hidden lg:flex items-center gap-2">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-green-500 hover:bg-green-50 hover:text-green-600">
                    <Icon name="MessageCircle" className="h-5 w-5" />
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                    <Icon name="Send" className="h-5 w-5" />
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
                <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="gap-1.5">
                  <Icon name="User" className="h-4 w-4" />
                  Кабинет
                </Button>
              ) : (
                <Button size="sm" className="gradient-primary text-white shadow-sm" onClick={() => navigate('/auth')}>
                  Войти
                </Button>
              )}
            </div>

            {/* Mobile right */}
            <div className="flex lg:hidden items-center gap-0.5">
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="h-11 w-11 flex items-center justify-center text-primary rounded-xl hover:bg-primary/10 transition-colors"
                aria-label="Позвонить"
              >
                <Icon name="Phone" className="h-5 w-5" />
              </a>
              {settings['whatsapp_number'] && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 flex items-center justify-center text-green-500 rounded-xl hover:bg-green-50 transition-colors"
                  aria-label="WhatsApp"
                >
                  <Icon name="MessageCircle" className="h-5 w-5" />
                </a>
              )}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
                    aria-label="Открыть меню"
                  >
                    <Icon name="Menu" className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto">
              <div className="px-4 pt-5 pb-8">
                {/* Navigation sections */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Навигация</p>
                <div className="space-y-0.5 mb-3">
                  {NAV_LINKS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium hover:bg-muted active:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-4 w-4 text-primary" />
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-border mb-3" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Страницы</p>
                <div className="space-y-0.5 mb-3">
                  <button
                    onClick={() => { navigate('/tariffs'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="MapPin" className="h-4 w-4 text-secondary" />
                    </div>
                    Все маршруты
                  </button>
                  {settings['feature_rideshares'] !== 'false' && (
                    <button
                      onClick={() => { navigate('/rideshares'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="Users" className="h-4 w-4 text-secondary" />
                      </div>
                      Попутчики
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/news'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="Newspaper" className="h-4 w-4 text-secondary" />
                    </div>
                    Новости
                  </button>
                  {settings['feature_driver_register'] !== 'false' && (
                    <button
                      onClick={() => { navigate('/become-driver'); setMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium hover:bg-muted transition-colors flex items-center gap-3 min-h-[52px]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Icon name="Car" className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Стать водителем</span>
                      <Badge className="ml-auto text-xs gradient-primary text-white border-0">Доход</Badge>
                    </button>
                  )}
                </div>

                {/* Messengers */}
                {(settings['whatsapp_number'] || settings['telegram_username'] || settings['max_username']) && (
                  <>
                    <div className="h-px bg-border mb-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Написать нам</p>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {settings['whatsapp_number'] && (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]">
                          <Button variant="outline" className="w-full h-12 border-green-300 text-green-600 hover:bg-green-50 gap-2">
                            <Icon name="MessageCircle" className="h-5 w-5" />WhatsApp
                          </Button>
                        </a>
                      )}
                      {settings['telegram_username'] && (
                        <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]">
                          <Button variant="outline" className="w-full h-12 border-blue-300 text-blue-600 hover:bg-blue-50 gap-2">
                            <Icon name="Send" className="h-5 w-5" />Telegram
                          </Button>
                        </a>
                      )}
                      {settings['max_username'] && maxUrl !== '#' && (
                        <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-12 w-12">
                            <Icon name="Share2" className="h-5 w-5 text-blue-600" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </>
                )}

                {/* Telegram group */}
                {telegramGroupUrl && settings['telegram_group_show'] !== 'false' && (
                  <a href={telegramGroupUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
                    <Button variant="outline" className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50 gap-2">
                      <Icon name="Send" className="h-4 w-4" />
                      {settings['telegram_group_title'] || 'Telegram группа'}
                    </Button>
                  </a>
                )}

                <div className="h-px bg-border mb-3" />

                {/* Auth */}
                <div className="flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      <Button className="w-full h-12 font-semibold" variant="outline" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                        <Icon name="User" className="mr-2 h-5 w-5" />
                        Личный кабинет
                      </Button>
                      <Button className="w-full h-12" variant="outline" onClick={() => { navigate('/passenger'); setMobileMenuOpen(false); }}>
                        <Icon name="Users" className="mr-2 h-4 w-4" />
                        Кабинет попутчика
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full h-12 gradient-primary text-white font-semibold shadow-md" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                        <Icon name="LogIn" className="mr-2 h-5 w-5" />
                        Войти в личный кабинет
                      </Button>
                      <Button className="w-full h-12" variant="outline" onClick={() => { navigate('/passenger'); setMobileMenuOpen(false); }}>
                        <Icon name="Users" className="mr-2 h-4 w-4" />
                        Кабинет пассажира
                      </Button>
                    </>
                  )}
                  {!isDriverLoggedIn && settings['feature_driver_register'] !== 'false' && (
                    <Button className="w-full h-12" variant="outline" onClick={() => { navigate('/driver/register'); setMobileMenuOpen(false); }}>
                      <Icon name="UserPlus" className="mr-2 h-4 w-4" />
                      Стать водителем
                    </Button>
                  )}
                </div>
              </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section id="главная" className="relative pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/8 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 pt-8 pb-14 md:pt-14 md:pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5 md:mb-7 border border-primary/20">
              <Icon name="Shield" className="h-4 w-4" />
              {heroBadge}
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight tracking-tight">
              Трансфер в{' '}
              <span className="text-gradient">Сочи</span>
              {' '}и{' '}
              <span className="text-gradient">Абхазию</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              {heroDesc}
            </p>

            {/* Mobile CTA */}
            <div className="flex sm:hidden gap-2 mb-5">
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex-1">
                <Button size="lg" className="w-full h-14 gradient-primary text-white font-bold text-base shadow-lg">
                  <Icon name="Phone" className="mr-2 h-5 w-5" />
                  Позвонить
                </Button>
              </a>
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full h-14 border-green-400 text-green-600 font-semibold">
                    <Icon name="MessageCircle" className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                </a>
              )}
            </div>

            {/* Booking form */}
            <div id="booking" className="text-left">
              <BookingForm />
            </div>

            {/* Trust chips */}
            <div className="grid grid-cols-3 gap-3 md:gap-8 mt-10 md:mt-14 max-w-lg mx-auto">
              {[
                { icon: 'Shield', title: 'Безопасность', desc: 'Опытные водители' },
                { icon: 'Clock', title: 'Пунктуальность', desc: 'Встречаем вовремя' },
                { icon: 'Star', title: 'Качество', desc: 'Комфортные авто' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl gradient-secondary flex items-center justify-center shadow-md">
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs md:text-sm">{item.title}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BECOME DRIVER BANNER
      ══════════════════════════════════════════════ */}
      {!isDriverLoggedIn && settings['feature_driver_register'] !== 'false' && (
        <section className="py-4 md:py-6 bg-gradient-to-r from-primary/8 to-secondary/8 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-4 md:p-5 rounded-2xl border border-primary/20 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                  <Icon name="Car" className="h-5 w-5 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-sm md:text-base leading-tight">Стать водителем ПоехалиПро</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Зарабатывайте от 60 000 ₽/мес на своём автомобиле</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button className="gradient-primary text-white flex-1 sm:flex-none h-11 font-semibold shadow-md" onClick={() => navigate('/become-driver')}>
                  Узнать подробнее
                  <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none h-11" onClick={() => navigate('/driver/register')}>
                  Подать заявку
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          TARIFFS
      ══════════════════════════════════════════════ */}
      <section id="тарифы" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-secondary/20">
              <Icon name="Tag" className="h-4 w-4" />
              Направления
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Направления и цены</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Фиксированные цены без скрытых доплат. Цена не меняется в зависимости от трафика.
            </p>
          </div>

          {tariffs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {tariffs.slice(0, 8).map((tariff, idx) => (
                <div
                  key={String(tariff.id)}
                  className="group relative bg-white dark:bg-card border-2 border-border hover:border-primary/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {/* City emoji / image */}
                  <div className="text-center mb-4">
                    {tariff.image_url ? (
                      <img src={String(tariff.image_url)} alt={String(tariff.city)} className="w-full h-24 object-cover rounded-xl mb-3" />
                    ) : (
                      <div className="text-5xl mb-2">{String(tariff.image_emoji || '🚗')}</div>
                    )}
                    <h3 className="font-bold text-lg leading-tight">{String(tariff.city)}</h3>
                    <p className="text-xs text-muted-foreground">из Аэропорта Сочи</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-extrabold text-gradient">{Number(tariff.price).toLocaleString('ru-RU')} ₽</div>
                    <p className="text-xs text-muted-foreground">за автомобиль</p>
                  </div>

                  {/* Meta */}
                  {(tariff.distance || tariff.duration) && (
                    <div className="flex justify-center gap-3 text-xs text-muted-foreground mb-4">
                      {tariff.distance && (
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" className="h-3 w-3 text-primary" />
                          {String(tariff.distance)}
                        </span>
                      )}
                      {tariff.duration && (
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" className="h-3 w-3 text-primary" />
                          ~{String(tariff.duration)}
                        </span>
                      )}
                    </div>
                  )}

                  <Button className="w-full gradient-primary text-white font-semibold h-11 group-hover:shadow-md transition-shadow">
                    Заказать
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Tag" className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Тарифы загружаются...</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="gap-2 h-12 px-6" onClick={() => navigate('/tariffs')}>
              <Icon name="Tag" className="h-4 w-4" />
              Все маршруты и калькулятор цен
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FLEET
      ══════════════════════════════════════════════ */}
      {fleet.length > 0 && (
        <section id="автопарк" className="py-14 md:py-20 bg-gradient-to-b from-background to-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-primary/20">
                <Icon name="Car" className="h-4 w-4" />
                Автопарк
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Наш автопарк</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
                Современные автомобили для вашего комфорта
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 max-w-5xl mx-auto">
              {fleet.slice(0, 6).map((car, idx) => (
                <div
                  key={String(car.id)}
                  className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  {car.image_url ? (
                    <img src={String(car.image_url)} alt={String(car.name)} className="w-full h-28 md:h-36 object-cover" />
                  ) : (
                    <div className="w-full h-28 md:h-36 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-4xl md:text-6xl">
                      {String(car.image_emoji || '🚗')}
                    </div>
                  )}
                  <div className="p-3 md:p-4">
                    <h3 className="font-bold text-sm md:text-base leading-tight mb-1">{String(car.name)}</h3>
                    <Badge className="gradient-secondary text-white border-0 text-[10px] md:text-xs mb-2">{String(car.type)}</Badge>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Users" className="h-3 w-3 text-primary" />
                        {String(car.capacity)} пасс.
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Luggage" className="h-3 w-3 text-primary" />
                        {String(car.luggage_capacity)} мест
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          RIDESHARES PROMO
      ══════════════════════════════════════════════ */}
      {settings['feature_rideshares'] !== 'false' && (
        <section id="попутчики" className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20 rounded-2xl overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium mb-4 border border-primary/20">
                      <Icon name="Users" className="h-4 w-4" />
                      Сервис
                    </div>
                    <h2 className="text-xl md:text-3xl font-extrabold mb-3">Едем вместе — дешевле!</h2>
                    <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed">
                      Раздели стоимость трансфера с другими пассажирами. Находи попутчиков из аэропорта Сочи в Абхазию.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="gradient-primary text-white h-12 font-semibold gap-2 shadow-md" onClick={() => navigate('/rideshares')}>
                        <Icon name="Users" className="h-4 w-4" />
                        Найти попутчиков
                      </Button>
                      <Button variant="outline" className="h-12 gap-2" onClick={() => navigate('/rideshares')}>
                        <Icon name="Plus" className="h-4 w-4" />
                        Предложить поездку
                      </Button>
                    </div>
                  </div>
                  <div className="text-6xl md:text-8xl flex-shrink-0">🚕</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════ */}
      <section id="о нас" className="py-14 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-secondary/20">
                <Icon name="Award" className="h-4 w-4" />
                О компании
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Почему выбирают нас</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: 'Award', title: `Работаем с ${siteYear} года`, desc: 'Более 50 000 довольных клиентов и тысячи положительных отзывов' },
                { icon: 'Shield', title: 'Гарантия безопасности', desc: 'Все водители с многолетним опытом, автомобили застрахованы' },
                { icon: 'Clock', title: 'Работаем 24/7', desc: 'Круглосуточная служба поддержки и диспетчерская' },
                { icon: 'DollarSign', title: 'Честные цены', desc: 'Фиксированная стоимость, без скрытых доплат и комиссий' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-5 bg-white dark:bg-card border border-border rounded-2xl hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          NEWS
      ══════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="py-10 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-primary/20">
                <Icon name="Newspaper" className="h-4 w-4" />
                Новости
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Последние новости</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {news.slice(0, 3).map(n => (
                <div
                  key={String(n.id)}
                  className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-0.5"
                  onClick={() => navigate('/news')}
                >
                  {n.image_url && (
                    <img src={String(n.image_url)} alt={String(n.title)} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
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
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" className="gap-2 h-11" onClick={() => navigate('/news')}>
                <Icon name="Newspaper" className="h-4 w-4" />
                Все новости
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          REVIEWS
      ══════════════════════════════════════════════ */}
      <section id="отзывы" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-yellow-200">
              <Icon name="Star" className="h-4 w-4" />
              Отзывы
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Что говорят клиенты</h2>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {reviews.slice(0, 6).map((r, idx) => (
                <div
                  key={String(r.id)}
                  className="bg-white dark:bg-card border border-border rounded-2xl p-4 md:p-5 hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {String(r.author_name || 'А').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{String(r.author_name || 'Аноним')}</p>
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
                          className={`h-3.5 w-3.5 ${i < Number(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{String(r.text)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Будьте первым, кто оставит отзыв!</p>
          )}

          <div className="text-center mt-8">
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary text-white h-13 px-8 font-semibold gap-2 shadow-lg">
                  <Icon name="Star" className="h-5 w-5" />
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
                          className={`text-3xl transition-transform hover:scale-110 ${reviewForm.rating >= n ? '' : 'grayscale opacity-40'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Текст отзыва</Label>
                    <Textarea
                      placeholder="Расскажите о вашей поездке..."
                      value={reviewForm.text}
                      onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full gradient-primary text-white h-12 font-semibold"
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

      {/* ══════════════════════════════════════════════
          CONTACTS
      ══════════════════════════════════════════════ */}
      <section id="контакты" className="py-14 md:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5 border border-primary/20">
              <Icon name="Phone" className="h-4 w-4" />
              Контакты
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Свяжитесь с нами</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8">
              Ответим на все вопросы и поможем с бронированием
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { icon: 'Phone', title: 'Телефон', value: phone, link: `tel:${phone.replace(/\D/g, '')}` },
                { icon: 'Mail', title: 'Email', value: email, link: `mailto:${email}` },
                { icon: 'MapPin', title: 'Адрес', value: address, link: '#' },
              ].map((contact, idx) => (
                <a
                  key={idx}
                  href={contact.link}
                  className="flex flex-col items-center p-5 bg-white dark:bg-card border border-border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mb-3 shadow-md">
                    <Icon name={contact.icon as Parameters<typeof Icon>[0]['name']} className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold mb-1 text-sm">{contact.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground break-all text-center">{contact.value}</p>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white h-12 gap-2">
                    <Icon name="MessageCircle" className="h-5 w-5" />WhatsApp
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white h-12 gap-2">
                    <Icon name="Send" className="h-5 w-5" />Telegram
                  </Button>
                </a>
              )}
              {settings['viber_number'] && (
                <a href={viberUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white h-12 gap-2">
                    <Icon name="Phone" className="h-5 w-5" />Viber
                  </Button>
                </a>
              )}
              {settings['max_username'] && maxUrl !== '#' && (
                <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 gap-2">
                    <Icon name="Zap" className="h-5 w-5" />MAX
                  </Button>
                </a>
              )}
              {settings['vk_url'] && vkUrl !== '#' && (
                <a href={vkUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white h-12 gap-2">
                    <Icon name="Share2" className="h-5 w-5" />ВКонтакте
                  </Button>
                </a>
              )}
              {settings['instagram_url'] && instagramUrl !== '#' && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white h-12 gap-2">
                    <Icon name="Camera" className="h-5 w-5" />Instagram
                  </Button>
                </a>
              )}
              {settings['youtube_url'] && youtubeUrl !== '#' && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white h-12 gap-2">
                    <Icon name="PlayCircle" className="h-5 w-5" />YouTube
                  </Button>
                </a>
              )}
              {settings['tiktok_url'] && tiktokUrl !== '#' && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-gray-900 hover:bg-black text-white h-12 gap-2">
                    <Icon name="Music" className="h-5 w-5" />TikTok
                  </Button>
                </a>
              )}
              {!settings['whatsapp_number'] && !settings['telegram_username'] && (
                <a href={`tel:${phone.replace(/\D/g, '')}`}>
                  <Button size="lg" className="gradient-primary text-white h-12 gap-2">
                    <Icon name="Phone" className="h-5 w-5" />{phone}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="py-8 md:py-12 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-gradient">{footerBrand}</span>
                <span className="text-xs text-muted-foreground">{footerSlogan}</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <button className="hover:text-primary transition-colors text-left" onClick={() => scrollTo('тарифы')}>Тарифы</button>
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

      {/* AI Assistant */}
      <AiAssistant />
    </div>
  );
};

export default Index;