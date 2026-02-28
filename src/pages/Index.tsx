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

  const whatsappUrl = settings['whatsapp_number'] ? `https://wa.me/${settings['whatsapp_number']}` : 'https://wa.me/79000000000';
  const telegramUrl = settings['telegram_username'] ? `https://t.me/${settings['telegram_username']}` : '#';
  const viberUrl = settings['viber_number'] ? `viber://chat?number=${settings['viber_number']}` : '#';
  const vkUrl = settings['vk_url'] || '#';
  const instagramUrl = settings['instagram_url'] || '#';
  const youtubeUrl = settings['youtube_url'] || '#';
  const tiktokUrl = settings['tiktok_url'] || '#';
  const maxUrl = settings['max_username'] ? (settings['max_username'].startsWith('http') ? settings['max_username'] : `https://max.ru/${settings['max_username']}`) : '#';
  const phone = settings['company_phone'] || '+7 (900) 000-00-00';
  const email = settings['company_email'] || 'info@poehali.pro';
  const address = settings['company_address'] || 'г. Сочи, Аэропорт';
  const heroBadge = settings['hero_badge_text'] || 'Надежные трансферы с 2012 года';
  const heroDesc = settings['hero_description'] || 'Комфортные поездки из аэропорта, вокзала и любой точки города.';
  const footerBrand = settings['footer_brand'] || 'ПоехалиПро';
  const footerSlogan = settings['footer_slogan'] || 'Трансфер Абхазия-Россия';
  const siteYear = settings['site_year'] || '2012';

  const navItems = ['Главная', 'Тарифы', 'Автопарк', 'О нас', 'Отзывы', 'Контакты'];

  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    const wa = settings['whatsapp_number'];
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(chatMessage)}`, '_blank');
    }
    setChatSent(true);
    setChatMessage('');
  };

  return (
    <div className="min-h-screen">
      {/* SEO meta */}
      {settings['site_title'] && (
        <title>{settings['site_title']}</title>
      )}

      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('главная')}>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-gradient">ПоехалиПро</span>
                <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">Трансфер Абхазия-Россия</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <button key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-all hover:text-primary ${activeSection === item.toLowerCase() ? 'text-primary' : 'text-foreground/70'}`}>
                  {item}
                </button>
              ))}
              <button onClick={() => navigate('/rideshares')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1">
                <Icon name="Users" className="h-3.5 w-3.5" />
                Попутчики
              </button>
              <button onClick={() => navigate('/news')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1">
                <Icon name="Newspaper" className="h-3.5 w-3.5" />
                Новости
              </button>
              <button onClick={() => navigate('/passenger')}
                className="text-sm font-medium transition-all hover:text-primary text-foreground/70 flex items-center gap-1">
                <Icon name="UserCircle" className="h-3.5 w-3.5" />
                Попутчики
              </button>
            </div>

            <div className="flex items-center gap-2">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform hidden sm:flex">
                    <Icon name="MessageCircle" className="h-5 w-5 text-green-500" />
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform hidden sm:flex">
                    <Icon name="Send" className="h-5 w-5 text-blue-500" />
                  </Button>
                </a>
              )}
              {isLoggedIn ? (
                <Button size="sm" variant="outline" className="hidden sm:flex" onClick={() => navigate('/profile')}>
                  <Icon name="User" className="mr-1.5 h-4 w-4" />
                  Кабинет
                </Button>
              ) : (
                <Button size="sm" className="gradient-primary text-white hidden sm:flex" onClick={() => navigate('/auth')}>
                  Войти
                </Button>
              )}
              <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Icon name={mobileMenuOpen ? 'X' : 'Menu'} className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map(item => (
                <button key={item} onClick={() => scrollToSection(item.toLowerCase())}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  {item}
                </button>
              ))}
              <button onClick={() => { navigate('/rideshares'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Icon name="Users" className="h-4 w-4" />
                Попутчики
              </button>
              <button onClick={() => { navigate('/passenger'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Icon name="UserCircle" className="h-4 w-4" />
                Кабинет попутчика
              </button>
              <div className="pt-2 border-t flex flex-col gap-2">
                {isLoggedIn ? (
                  <Button className="w-full" variant="outline" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                    <Icon name="User" className="mr-2 h-4 w-4" />
                    Личный кабинет
                  </Button>
                ) : (
                  <Button className="w-full gradient-primary text-white" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                    Войти / Зарегистрироваться
                  </Button>
                )}
                {isDriverLoggedIn ? (
                  <Button className="w-full" variant="outline" onClick={() => { navigate('/driver/cabinet'); setMobileMenuOpen(false); }}>
                    <Icon name="Car" className="mr-2 h-4 w-4" />
                    Кабинет водителя
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" onClick={() => { navigate('/driver/register'); setMobileMenuOpen(false); }}>
                    Стать водителем
                  </Button>
                )}
                <div className="flex gap-3 justify-center pt-2">
                  {settings['whatsapp_number'] && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon"><Icon name="MessageCircle" className="h-5 w-5 text-green-500" /></Button>
                    </a>
                  )}
                  {settings['telegram_username'] && (
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon"><Icon name="Send" className="h-5 w-5 text-blue-500" /></Button>
                    </a>
                  )}
                  {settings['max_username'] && (
                    <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon"><Icon name="Share2" className="h-5 w-5 text-blue-600" /></Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Герой */}
      <section id="главная" className="relative pt-28 md:pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 px-6 py-2 text-sm gradient-primary text-white border-0">
              {heroBadge}
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Трансфер в <span className="text-gradient">Сочи</span> и <span className="text-gradient">Абхазию</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {heroDesc}
            </p>

            <BookingForm />

            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-12 max-w-2xl mx-auto">
              {[
                { icon: 'Shield', title: 'Безопасность', desc: 'Опытные водители' },
                { icon: 'Clock', title: 'Пунктуальность', desc: 'Встречаем вовремя' },
                { icon: 'Star', title: 'Качество', desc: 'Комфортные авто' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-secondary flex items-center justify-center">
                    <Icon name={item.icon} className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-lg">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Стать водителем */}
      {!isDriverLoggedIn && (
        <section className="py-8 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="Car" className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Стать водителем ПоехалиПро</p>
                  <p className="text-sm text-muted-foreground">Зарабатывайте на своём автомобиле</p>
                </div>
              </div>
              <Button className="gradient-primary text-white flex-shrink-0 w-full sm:w-auto" onClick={() => navigate('/driver/register')}>
                Подать заявку
                <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Тарифы */}
      <section id="тарифы" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 gradient-secondary text-white border-0">Тарифы</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Направления и цены</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Фиксированные цены без скрытых доплат. Цена не меняется в зависимости от трафика.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {tariffs.map((tariff, idx) => (
              <Card key={String(tariff.id)} className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CardHeader className="text-center pb-4">
                  {tariff.image_url ? (
                    <img src={String(tariff.image_url)} alt={String(tariff.city)} className="w-full h-32 object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="text-5xl md:text-6xl mb-4">{String(tariff.image_emoji || '🚗')}</div>
                  )}
                  <CardTitle className="text-xl md:text-2xl">{String(tariff.city)}</CardTitle>
                  <CardDescription className="text-sm">из Аэропорта Сочи</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{String(tariff.price)} ₽</div>
                    <p className="text-sm text-muted-foreground">за автомобиль</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    {tariff.distance && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="MapPin" className="h-4 w-4 text-primary" />
                        <span>{String(tariff.distance)}</span>
                      </div>
                    )}
                    {tariff.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Clock" className="h-4 w-4 text-primary" />
                        <span>~{String(tariff.duration)}</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full gradient-primary text-white hover:scale-105 transition-transform"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Заказать
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Автопарк */}
      <section id="автопарк" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 gradient-primary text-white border-0">Автопарк</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Наш автопарк</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Современные автомобили для вашего комфорта
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {fleet.map((car, idx) => (
              <Card key={String(car.id)} className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CardHeader className="text-center">
                  {car.image_url ? (
                    <img src={String(car.image_url)} alt={String(car.name)} className="w-full h-40 object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="text-6xl md:text-7xl mb-4">{String(car.image_emoji || '🚗')}</div>
                  )}
                  <CardTitle className="text-xl mb-2">{String(car.name)}</CardTitle>
                  <Badge className="gradient-secondary text-white border-0">{String(car.type)}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Users" className="h-4 w-4 text-primary" />
                      <span>{String(car.capacity)} пасс.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Luggage" className="h-4 w-4 text-primary" />
                      <span>{String(car.luggage_capacity)} мест</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    {(car.features as string[]).slice(0, 3).map((feature: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-2 text-sm">
                        <Icon name="CheckCircle2" className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Выбрать авто
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Попутчики */}
      <section id="попутчики" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20 overflow-hidden">
              <CardContent className="p-6 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="flex-1">
                    <Badge className="mb-4 gradient-primary text-white border-0">Сервис</Badge>
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">Едем вместе — дешевле!</h2>
                    <p className="text-muted-foreground mb-6 text-base md:text-lg">
                      Раздели стоимость трансфера с другими пассажирами. Находи попутчиков из аэропорта Сочи в Абхазию.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button className="gradient-primary text-white" onClick={() => navigate('/rideshares')}>
                        <Icon name="Users" className="mr-2 h-4 w-4" />
                        Найти попутчиков
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/rideshares')}>
                        <Icon name="Plus" className="mr-2 h-4 w-4" />
                        Предложить поездку
                      </Button>
                    </div>
                  </div>
                  <div className="text-6xl md:text-8xl">🚕</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* О нас */}
      <section id="о нас" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 gradient-secondary text-white border-0">О нас</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Почему выбирают нас</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {[
                { icon: 'Award', title: `Работаем с ${siteYear} года`, desc: 'Более 50 000 довольных клиентов и тысячи положительных отзывов' },
                { icon: 'Shield', title: 'Гарантия безопасности', desc: 'Все водители с многолетним опытом, автомобили застрахованы' },
                { icon: 'Clock', title: 'Работаем 24/7', desc: 'Круглосуточная служба поддержки и диспетчерская' },
                { icon: 'DollarSign', title: 'Честные цены', desc: 'Фиксированная стоимость, без скрытых доплат и комиссий' }
              ].map((item, idx) => (
                <Card key={idx} className="glass-effect border-white/40 hover:shadow-xl transition-all">
                  <CardContent className="p-5 md:p-6 flex gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section id="отзывы" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 gradient-primary text-white border-0">Отзывы</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Что говорят клиенты</h2>
          </div>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {reviews.slice(0, 6).map((r, idx) => (
                <Card key={String(r.id)} className="hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                          {String(r.author_name || 'А').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{String(r.author_name || 'Аноним')}</p>
                          {r.source && r.source !== 'site' && <p className="text-xs text-muted-foreground">{String(r.source)}</p>}
                        </div>
                      </div>
                      <div className="text-yellow-400 text-sm">{'★'.repeat(Number(r.rating))}{'☆'.repeat(5 - Number(r.rating))}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">{String(r.text)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Будьте первым, кто оставит отзыв!</p>
          )}
          <div className="text-center mt-8">
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary text-white">
                  <Icon name="Star" className="mr-2 h-5 w-5" />
                  Оставить отзыв
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Ваш отзыв о сервисе</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Ваше имя</Label>
                    <Input placeholder="Как вас зовут?" value={reviewForm.author_name}
                      onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Оценка</Label>
                    <div className="flex gap-2 mt-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                          className={`text-3xl transition-transform hover:scale-110 ${n <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Ваш отзыв</Label>
                    <Textarea placeholder="Расскажите о вашем опыте..." rows={4} value={reviewForm.text}
                      onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} />
                  </div>
                  <Button className="w-full gradient-primary text-white" onClick={submitReview} disabled={reviewSending}>
                    {reviewSending ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                    Отправить отзыв
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Отзыв появится после проверки модератором</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Новости */}
      {news.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-4 gradient-secondary text-white border-0">Новости</Badge>
              <h2 className="text-3xl font-bold">Последние новости</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {news.slice(0, 3).map((n) => (
                <Card key={String(n.id)} className="hover:shadow-lg transition-all">
                  {n.image_url && (
                    <img src={String(n.image_url)} alt={String(n.title)} className="w-full h-40 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-4">
                    <p className="font-semibold mb-2 line-clamp-2">{String(n.title)}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{String(n.content)}</p>
                    {n.published_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(String(n.published_at)).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Контакты */}
      <section id="контакты" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-4 gradient-primary text-white border-0">Контакты</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Свяжитесь с нами</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10">
              Ответим на все вопросы и поможем с бронированием
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
              {[
                { icon: 'Phone', title: 'Телефон', value: phone, link: `tel:${phone.replace(/\D/g, '')}` },
                { icon: 'Mail', title: 'Email', value: email, link: `mailto:${email}` },
                { icon: 'MapPin', title: 'Адрес', value: address, link: '#' }
              ].map((contact, idx) => (
                <a key={idx} href={contact.link}
                  className="block p-5 md:p-6 rounded-xl glass-effect border border-white/40 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-3">
                    <Icon name={contact.icon} className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm md:text-base">{contact.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{contact.value}</p>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {settings['whatsapp_number'] && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                    <Icon name="MessageCircle" className="mr-2 h-5 w-5" />WhatsApp
                  </Button>
                </a>
              )}
              {settings['telegram_username'] && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Icon name="Send" className="mr-2 h-5 w-5" />Telegram
                  </Button>
                </a>
              )}
              {settings['viber_number'] && (
                <a href={viberUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Icon name="Phone" className="mr-2 h-5 w-5" />Viber
                  </Button>
                </a>
              )}
              {settings['max_username'] && maxUrl !== '#' && (
                <a href={maxUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Icon name="Zap" className="mr-2 h-5 w-5" />MAX
                  </Button>
                </a>
              )}
              {settings['vk_url'] && vkUrl !== '#' && (
                <a href={vkUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white">
                    <Icon name="Share2" className="mr-2 h-5 w-5" />ВКонтакте
                  </Button>
                </a>
              )}
              {settings['instagram_url'] && instagramUrl !== '#' && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white">
                    <Icon name="Camera" className="mr-2 h-5 w-5" />Instagram
                  </Button>
                </a>
              )}
              {settings['youtube_url'] && youtubeUrl !== '#' && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white">
                    <Icon name="PlayCircle" className="mr-2 h-5 w-5" />YouTube
                  </Button>
                </a>
              )}
              {settings['tiktok_url'] && tiktokUrl !== '#' && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-gray-900 hover:bg-black text-white">
                    <Icon name="Music" className="mr-2 h-5 w-5" />TikTok
                  </Button>
                </a>
              )}
              {!settings['whatsapp_number'] && !settings['telegram_username'] && (
                <a href={`tel:${phone.replace(/\D/g, '')}`}>
                  <Button size="lg" className="gradient-primary text-white">
                    <Icon name="Phone" className="mr-2 h-5 w-5" />{phone}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="py-8 md:py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-gradient">{footerBrand}</span>
                <span className="text-xs text-muted-foreground">{footerSlogan}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {settings['terms_of_service'] && (
                <button className="hover:text-primary transition-colors" onClick={() => alert(settings['terms_of_service'])}>
                  Правила сервиса
                </button>
              )}
              {settings['privacy_policy'] && (
                <button className="hover:text-primary transition-colors" onClick={() => alert(settings['privacy_policy'])}>
                  Политика конфиденциальности
                </button>
              )}
              <button className="hover:text-primary transition-colors" onClick={() => navigate('/driver/register')}>
                Стать водителем
              </button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {siteYear} {footerBrand} {footerSlogan}. Все права защищены.
            </p>
          </div>
        </div>
      </footer>

      {/* Чат поддержки */}
      {settings['chat_enabled'] !== 'false' && (
        <>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Icon name={chatOpen ? 'X' : 'MessageSquare'} className="h-6 w-6 text-white" />
          </button>

          {chatOpen && (
            <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm bg-background border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="gradient-primary p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon name="Headphones" className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Поддержка</p>
                    <p className="text-white/70 text-xs">Обычно отвечаем за 5 минут</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {chatSent ? (
                  <div className="text-center py-6">
                    <Icon name="CheckCircle2" className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="font-medium">Сообщение отправлено!</p>
                    <p className="text-sm text-muted-foreground mt-1">Мы скоро ответим вам в WhatsApp</p>
                    <Button variant="outline" className="mt-4" onClick={() => { setChatSent(false); setChatMessage(''); }}>
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
                        className="flex-1"
                      />
                      <Button className="gradient-primary text-white" onClick={handleChatSend}>
                        <Icon name="Send" className="h-4 w-4" />
                      </Button>
                    </div>
                    {settings['whatsapp_number'] && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full mt-2 text-green-600 border-green-300">
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