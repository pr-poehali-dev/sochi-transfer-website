import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import BookingForm from '@/components/BookingForm';
import { API_URLS } from '@/config/api';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');

  const [tariffs, setTariffs] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);

  useEffect(() => {
    loadTariffs();
    loadFleet();
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

  const loadFleet = async () => {
    try {
      const response = await fetch(`${API_URLS.fleet}?active=true`);
      const data = await response.json();
      setFleet(data.fleet || []);
    } catch (error) {
      console.error('Failed to load fleet:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="text-3xl">🚗</div>
              <span className="text-2xl font-bold text-gradient">Sochi Transfer</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {['Главная', 'Тарифы', 'Автопарк', 'О нас', 'Контакты'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-all hover:text-primary ${
                    activeSection === item.toLowerCase() ? 'text-primary' : 'text-foreground/70'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <a href="https://wa.me/79123456789" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
                  <Icon name="MessageCircle" className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
                  <Icon name="Instagram" className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section id="главная" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 px-6 py-2 text-sm gradient-primary text-white border-0">
              Надежные трансферы с 2015 года
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Трансфер в <span className="text-gradient">Сочи</span> и <span className="text-gradient">Абхазию</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Комфортные поездки из аэропорта, вокзала и любой точки города. Встречаем с табличкой!
            </p>

            <BookingForm />

            <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
              {[
                { icon: 'Shield', title: 'Безопасность', desc: 'Опытные водители' },
                { icon: 'Clock', title: 'Пунктуальность', desc: 'Встречаем вовремя' },
                { icon: 'Star', title: 'Качество', desc: 'Комфортные авто' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center">
                    <Icon name={item.icon} className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="тарифы" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 gradient-secondary text-white border-0">Тарифы</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Направления и цены</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Фиксированные цены без скрытых доплат. Цена не меняется в зависимости от трафика.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {tariffs.map((tariff, idx) => (
              <Card key={tariff.id} className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CardHeader className="text-center pb-4">
                  <div className="text-6xl mb-4">{tariff.image_emoji}</div>
                  <CardTitle className="text-2xl">{tariff.city}</CardTitle>
                  <CardDescription className="text-sm">из Аэропорта Сочи</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gradient mb-1">{tariff.price} ₽</div>
                    <p className="text-sm text-muted-foreground">за автомобиль</p>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="MapPin" className="h-4 w-4 text-primary" />
                      <span>{tariff.distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Clock" className="h-4 w-4 text-primary" />
                      <span>~{tariff.duration}</span>
                    </div>
                  </div>

                  <Button className="w-full gradient-primary text-white hover:scale-105 transition-transform" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Заказать
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="автопарк" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 gradient-primary text-white border-0">Автопарк</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Наш автопарк</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Современные автомобили премиум-класса для вашего комфорта
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {fleet.map((car, idx) => (
              <Card key={car.id} className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CardHeader className="text-center">
                  <div className="text-7xl mb-4">{car.image_emoji}</div>
                  <CardTitle className="text-xl mb-2">{car.name}</CardTitle>
                  <Badge className="gradient-secondary text-white border-0">{car.type}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Users" className="h-4 w-4 text-primary" />
                      <span>{car.capacity} пасс.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Luggage" className="h-4 w-4 text-primary" />
                      <span>{car.luggage_capacity} мест</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    {car.features.slice(0, 3).map((feature: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-2 text-sm">
                        <Icon name="CheckCircle2" className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full hover:gradient-primary hover:text-white hover:border-0 transition-all" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Выбрать авто
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="о нас" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 gradient-secondary text-white border-0">О нас</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Почему выбирают нас</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: 'Award',
                  title: '9 лет опыта',
                  desc: 'Более 50 000 довольных клиентов и тысячи положительных отзывов'
                },
                {
                  icon: 'Shield',
                  title: 'Гарантия безопасности',
                  desc: 'Все водители с многолетним опытом, автомобили застрахованы'
                },
                {
                  icon: 'Clock',
                  title: 'Работаем 24/7',
                  desc: 'Круглосуточная служба поддержки и диспетчерская'
                },
                {
                  icon: 'DollarSign',
                  title: 'Честные цены',
                  desc: 'Фиксированная стоимость, без скрытых доплат и комиссий'
                }
              ].map((item, idx) => (
                <Card key={idx} className="glass-effect border-white/40 hover:shadow-xl transition-all animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="контакты" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-4 gradient-primary text-white border-0">Контакты</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Свяжитесь с нами</h2>
            <p className="text-lg text-muted-foreground mb-10">
              Ответим на все вопросы и поможем с бронированием
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: 'Phone', title: 'Телефон', value: '+7 (912) 345-67-89', link: 'tel:+79123456789' },
                { icon: 'Mail', title: 'Email', value: 'info@sochi-transfer.ru', link: 'mailto:info@sochi-transfer.ru' },
                { icon: 'MapPin', title: 'Адрес', value: 'г. Сочи, Аэропорт', link: '#' }
              ].map((contact, idx) => (
                <a
                  key={idx}
                  href={contact.link}
                  className="block p-6 rounded-xl glass-effect border border-white/40 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-3">
                    <Icon name={contact.icon} className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{contact.title}</h3>
                  <p className="text-sm text-muted-foreground">{contact.value}</p>
                </a>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <a href="https://wa.me/79123456789" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gradient-primary text-white hover:scale-105 transition-transform">
                  <Icon name="MessageCircle" className="mr-2 h-5 w-5" />
                  WhatsApp
                </Button>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="hover:gradient-secondary hover:text-white hover:border-0 transition-all">
                  <Icon name="Instagram" className="mr-2 h-5 w-5" />
                  Instagram
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🚗</div>
              <span className="text-xl font-bold text-gradient">Sochi Transfer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Sochi Transfer. Все права защищены.
            </p>
            <div className="flex gap-3">
              <a href="https://wa.me/79123456789">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
                  <Icon name="MessageCircle" className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://instagram.com">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
                  <Icon name="Instagram" className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;