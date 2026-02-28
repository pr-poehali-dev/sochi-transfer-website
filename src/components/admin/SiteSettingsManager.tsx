import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Settings {
  [key: string]: string;
}

const SiteSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<{ id: number; name: string; description: string; price: number; icon: string; is_active: boolean }[]>([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', icon: 'Star' });

  useEffect(() => {
    loadSettings();
    loadServices();
  }, []);

  const loadSettings = async () => {
    try {
      const r = await fetch(API_URLS.settings);
      const data = await r.json();
      setSettings(data.settings || {});
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const loadServices = async () => {
    try {
      const r = await fetch(`${API_URLS.services}&admin=true`);
      const data = await r.json();
      setServices(data.services || []);
    } catch { /* silent */ }
  };

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  const saveSettings = async (keys: string[]) => {
    setSaving(true);
    const subset: Settings = {};
    keys.forEach(k => { if (settings[k] !== undefined) subset[k] = settings[k]; });
    try {
      await fetch(API_URLS.settings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: subset })
      });
      toast({ title: 'Настройки сохранены' });
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const addService = async () => {
    if (!newService.name) { toast({ title: 'Укажите название', variant: 'destructive' }); return; }
    await fetch(API_URLS.services, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newService, price: parseFloat(newService.price || '0') })
    });
    toast({ title: 'Услуга добавлена' });
    setNewService({ name: '', description: '', price: '', icon: 'Star' });
    loadServices();
  };

  const toggleService = async (id: number, s: { name: string; description: string; price: number; icon: string; is_active: boolean }) => {
    await fetch(API_URLS.services, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...s, is_active: !s.is_active })
    });
    loadServices();
  };

  const deleteService = async (id: number) => {
    if (!confirm('Удалить услугу?')) return;
    await fetch(`${API_URLS.services}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Услуга удалена' });
    loadServices();
  };

  const SaveButton = ({ keys }: { keys: string[] }) => (
    <Button className="gradient-primary text-white" onClick={() => saveSettings(keys)} disabled={saving}>
      {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : <Icon name="Save" className="h-4 w-4 mr-2" />}
      Сохранить
    </Button>
  );

  return (
    <Tabs defaultValue="seo">
      <TabsList className="flex-wrap h-auto gap-1 mb-6">
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="messengers">Мессенджеры</TabsTrigger>
        <TabsTrigger value="metrika">Яндекс.Метрика</TabsTrigger>
        <TabsTrigger value="texts">Тексты сайта</TabsTrigger>
        <TabsTrigger value="rules">Правила/Политика</TabsTrigger>
        <TabsTrigger value="services">Допуслуги</TabsTrigger>
        <TabsTrigger value="drivers_settings">Водители</TabsTrigger>
        <TabsTrigger value="telegram">
          <Icon name="Send" className="mr-1.5 h-3.5 w-3.5" />
          Telegram
        </TabsTrigger>
        <TabsTrigger value="become_driver_content">
          <Icon name="Car" className="mr-1.5 h-3.5 w-3.5" />
          Стать водителем
        </TabsTrigger>
      </TabsList>

      <TabsContent value="seo">
        <Card>
          <CardHeader><CardTitle>SEO настройки</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Заголовок сайта (Title)</Label>
              <Input value={settings['site_title'] || ''} onChange={e => set('site_title', e.target.value)} placeholder="ПоехалиПро — Трансфер Абхазия-Россия" />
            </div>
            <div>
              <Label>Описание (Description)</Label>
              <Textarea value={settings['site_description'] || ''} onChange={e => set('site_description', e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Ключевые слова (Keywords)</Label>
              <Input value={settings['site_keywords'] || ''} onChange={e => set('site_keywords', e.target.value)} placeholder="трансфер сочи, такси сочи абхазия..." />
            </div>
            <SaveButton keys={['site_title', 'site_description', 'site_keywords']} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Контактная информация сайта</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ссылка на Telegram-канал / бот</Label>
              <Input value={settings['site_telegram_url'] || ''} onChange={e => set('site_telegram_url', e.target.value)} placeholder="https://t.me/poehaliplus" />
            </div>
            <div>
              <Label>Телефон для отображения</Label>
              <Input value={settings['site_phone_display'] || ''} onChange={e => set('site_phone_display', e.target.value)} placeholder="+7 (900) 000-00-00" />
            </div>
            <div>
              <Label>Адрес / регион работы</Label>
              <Input value={settings['site_address'] || ''} onChange={e => set('site_address', e.target.value)} placeholder="Сочи, Краснодарский край" />
            </div>
            <SaveButton keys={['site_telegram_url', 'site_phone_display', 'site_address']} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messengers">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Мессенджеры</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>WhatsApp номер (без +, например: 79001234567)</Label>
                <Input value={settings['whatsapp_number'] || ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="79001234567" />
              </div>
              <div>
                <Label>Telegram username (без @)</Label>
                <Input value={settings['telegram_username'] || ''} onChange={e => set('telegram_username', e.target.value)} placeholder="poehaliplus" />
              </div>
              <div>
                <Label>Viber номер (без +)</Label>
                <Input value={settings['viber_number'] || ''} onChange={e => set('viber_number', e.target.value)} placeholder="79001234567" />
              </div>
              <div>
                <Label>MAX (VK Мессенджер) — username или ссылка</Label>
                <Input value={settings['max_username'] || ''} onChange={e => set('max_username', e.target.value)} placeholder="poehaliplus" />
              </div>
              <div>
                <Label>Телефон компании</Label>
                <Input value={settings['company_phone'] || ''} onChange={e => set('company_phone', e.target.value)} placeholder="+7 (912) 345-67-89" />
              </div>
              <div>
                <Label>Email компании</Label>
                <Input value={settings['company_email'] || ''} onChange={e => set('company_email', e.target.value)} />
              </div>
              <div>
                <Label>Адрес</Label>
                <Input value={settings['company_address'] || ''} onChange={e => set('company_address', e.target.value)} />
              </div>
              <SaveButton keys={['whatsapp_number', 'telegram_username', 'viber_number', 'max_username', 'company_phone', 'company_email', 'company_address']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Социальные сети</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ВКонтакте / MAX (полная ссылка)</Label>
                <Input value={settings['vk_url'] || ''} onChange={e => set('vk_url', e.target.value)} placeholder="https://vk.com/poehaliplus" />
              </div>
              <div>
                <Label>Instagram (полная ссылка)</Label>
                <Input value={settings['instagram_url'] || ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/poehaliplus" />
              </div>
              <div>
                <Label>YouTube (полная ссылка)</Label>
                <Input value={settings['youtube_url'] || ''} onChange={e => set('youtube_url', e.target.value)} placeholder="https://youtube.com/@poehaliplus" />
              </div>
              <div>
                <Label>TikTok (полная ссылка)</Label>
                <Input value={settings['tiktok_url'] || ''} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@poehaliplus" />
              </div>
              <div>
                <Label>Facebook (полная ссылка)</Label>
                <Input value={settings['facebook_url'] || ''} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/poehaliplus" />
              </div>
              <SaveButton keys={['vk_url', 'instagram_url', 'youtube_url', 'tiktok_url', 'facebook_url']} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="metrika">
        <Card>
          <CardHeader><CardTitle>Яндекс.Метрика</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Номер счётчика Яндекс.Метрики</Label>
              <Input value={settings['yandex_metrika_id'] || ''} onChange={e => set('yandex_metrika_id', e.target.value)} placeholder="12345678" />
              <p className="text-xs text-muted-foreground mt-1">
                Найдите номер в разделе &quot;Настройки → Код счётчика&quot; в личном кабинете Яндекс.Метрики
              </p>
            </div>
            <SaveButton keys={['yandex_metrika_id']} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="texts">
        <Card>
          <CardHeader><CardTitle>Тексты на сайте</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Бейдж главного экрана</Label>
              <Input value={settings['hero_badge_text'] || ''} onChange={e => set('hero_badge_text', e.target.value)} placeholder="Надежные трансферы с 2012 года" />
            </div>
            <div>
              <Label>Описание на главном экране</Label>
              <Textarea value={settings['hero_description'] || ''} onChange={e => set('hero_description', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Бренд в футере</Label>
              <Input value={settings['footer_brand'] || ''} onChange={e => set('footer_brand', e.target.value)} placeholder="ПоехалиПро" />
            </div>
            <div>
              <Label>Слоган в футере</Label>
              <Input value={settings['footer_slogan'] || ''} onChange={e => set('footer_slogan', e.target.value)} placeholder="Трансфер Абхазия-Россия" />
            </div>
            <div>
              <Label>Год основания (для © в футере)</Label>
              <Input value={settings['site_year'] || ''} onChange={e => set('site_year', e.target.value)} placeholder="2012" />
            </div>
            <div>
              <Label>Цена группового трансфера (с человека, ₽)</Label>
              <Input type="number" value={settings['group_transfer_price_per_person'] || ''} onChange={e => set('group_transfer_price_per_person', e.target.value)} placeholder="1500" />
            </div>
            <SaveButton keys={['hero_badge_text', 'hero_description', 'footer_brand', 'footer_slogan', 'site_year', 'group_transfer_price_per_person']} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rules">
        <Card>
          <CardHeader><CardTitle>Правила и политика</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Правила сервиса</Label>
              <Textarea value={settings['terms_of_service'] || ''} onChange={e => set('terms_of_service', e.target.value)} rows={8} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Политика конфиденциальности</Label>
              <Textarea value={settings['privacy_policy'] || ''} onChange={e => set('privacy_policy', e.target.value)} rows={8} className="font-mono text-xs" />
            </div>
            <SaveButton keys={['terms_of_service', 'privacy_policy']} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services">
        <Card>
          <CardHeader><CardTitle>Дополнительные услуги в заказе</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-4 border rounded-lg bg-muted/30">
              <Input placeholder="Название" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} />
              <Input placeholder="Описание" value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} />
              <Input type="number" placeholder="Цена ₽" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} />
              <Input placeholder="Иконка (Lucide)" value={newService.icon} onChange={e => setNewService(s => ({ ...s, icon: e.target.value }))} />
              <Button className="sm:col-span-4 gradient-primary text-white" onClick={addService}>
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить услугу
              </Button>
            </div>
            <div className="space-y-2">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon name={s.icon || 'Star'} className="h-5 w-5 text-primary" fallback="Star" />
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.description} · {s.price} ₽</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleService(s.id, s)}
                      className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {s.is_active ? 'Активна' : 'Выкл'}
                    </button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteService(s.id)}>
                      <Icon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="drivers_settings">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Настройки водителей</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Комиссия по умолчанию (%) для новых водителей</Label>
                <Input
                  type="number" min="0" max="50"
                  value={settings['default_driver_commission'] || '15'}
                  onChange={e => set('default_driver_commission', e.target.value)}
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground mt-1">Процент, который платит водитель с каждого заказа. Индивидуально настраивается в карточке водителя.</p>
              </div>
              <div>
                <Label>Лимит регистрации водителей (0 = без лимита)</Label>
                <Input
                  type="number" min="0"
                  value={settings['driver_registration_limit'] || '0'}
                  onChange={e => set('driver_registration_limit', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Минимальный баланс для работы (₽)</Label>
                <Input
                  type="number" min="0"
                  value={settings['driver_min_balance'] || '0'}
                  onChange={e => set('driver_min_balance', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Водители с балансом ниже этого значения не могут принимать заказы.</p>
              </div>
              <SaveButton keys={['default_driver_commission', 'driver_registration_limit', 'driver_min_balance']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Страница "Стать водителем"</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Заголовок страницы</Label>
                <Input value={settings['become_driver_hero_subtitle'] || ''} onChange={e => set('become_driver_hero_subtitle', e.target.value)} placeholder="Зарабатывайте на своём автомобиле..." />
              </div>
              <div>
                <Label>Список требований (через ; или с новой строки)</Label>
                <Textarea value={settings['driver_requirement_list'] || ''} onChange={e => set('driver_requirement_list', e.target.value)} rows={4} placeholder="Водительское удостоверение категории B;Автомобиль не старше 2015 года;ОСАГО и КАСКО" />
              </div>
              <div>
                <Label>Ставка комиссии (отображается на странице)</Label>
                <Input value={settings['driver_commission_rate'] || '15'} onChange={e => set('driver_commission_rate', e.target.value)} placeholder="15" />
              </div>
              <SaveButton keys={['become_driver_hero_subtitle', 'driver_requirement_list', 'driver_commission_rate']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Типы водителей</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Тип водителя назначается при регистрации. Трансферные водители берут заказы трансфера. Водители-попутчики создают поездки попутчиков.
              </p>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Разрешить регистрацию водителей-попутчиков</p>
                  <p className="text-xs text-muted-foreground">Водители с типом «rideshare» могут создавать поездки попутчиков</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('allow_rideshare_drivers', settings['allow_rideshare_drivers'] === 'true' ? 'false' : 'true')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings['allow_rideshare_drivers'] === 'true' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings['allow_rideshare_drivers'] === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Разрешить регистрацию трансферных водителей</p>
                  <p className="text-xs text-muted-foreground">Водители с типом «transfer» могут принимать заказы трансфера</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('allow_transfer_drivers', settings['allow_transfer_drivers'] === 'false' ? 'false' : 'true')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings['allow_transfer_drivers'] !== 'false' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings['allow_transfer_drivers'] !== 'false' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <SaveButton keys={['allow_rideshare_drivers', 'allow_transfer_drivers']} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="telegram">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Telegram-группа</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ссылка на группу Telegram</Label>
                <Input value={settings['telegram_group_url'] || ''} onChange={e => set('telegram_group_url', e.target.value)} placeholder="https://t.me/+xxxxx" />
              </div>
              <div>
                <Label>Название группы</Label>
                <Input value={settings['telegram_group_title'] || ''} onChange={e => set('telegram_group_title', e.target.value)} placeholder="Попутчики ПоехалиПро" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Показывать кнопку группы на сайте</p>
                  <p className="text-xs text-muted-foreground">Отображать ссылку на Telegram-группу в шапке и на страницах</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('telegram_group_show', settings['telegram_group_show'] === 'true' ? 'false' : 'true')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings['telegram_group_show'] === 'true' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings['telegram_group_show'] === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <SaveButton keys={['telegram_group_url', 'telegram_group_title', 'telegram_group_show']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Уведомления в Telegram</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Icon name="Info" className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Бот настраивается через секреты проекта</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Переменные <code className="bg-muted px-1 rounded text-[11px]">TELEGRAM_BOT_TOKEN</code> и{' '}
                    <code className="bg-muted px-1 rounded text-[11px]">TELEGRAM_CHAT_ID</code> задаются
                    в настройках деплоя (secrets). Уведомления о новых заказах и водителях отправляются автоматически при наличии этих переменных.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="become_driver_content">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Заголовок страницы</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Заголовок страницы (Hero title)</Label>
                <Input value={settings['become_driver_hero_title'] || ''} onChange={e => set('become_driver_hero_title', e.target.value)} placeholder="Станьте водителем ПоехалиПро" />
              </div>
              <div>
                <Label>Подзаголовок (Hero subtitle)</Label>
                <Input value={settings['become_driver_hero_subtitle'] || ''} onChange={e => set('become_driver_hero_subtitle', e.target.value)} placeholder="Зарабатывайте на своём автомобиле" />
              </div>
              <SaveButton keys={['become_driver_hero_title', 'become_driver_hero_subtitle']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Преимущества</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Текст о заработке</Label>
                <Textarea value={settings['become_driver_benefit_earnings'] || ''} onChange={e => set('become_driver_benefit_earnings', e.target.value)} rows={2} placeholder="Зарабатывайте от 80 000 ₽ в месяц на своём маршруте" />
              </div>
              <div>
                <Label>Текст о графике</Label>
                <Textarea value={settings['become_driver_benefit_schedule'] || ''} onChange={e => set('become_driver_benefit_schedule', e.target.value)} rows={2} placeholder="Работайте когда удобно — без фиксированного расписания" />
              </div>
              <div>
                <Label>Текст о поддержке</Label>
                <Textarea value={settings['become_driver_benefit_support'] || ''} onChange={e => set('become_driver_benefit_support', e.target.value)} rows={2} placeholder="Персональный менеджер и круглосуточная поддержка" />
              </div>
              <div>
                <Label>Текст о страховании</Label>
                <Textarea value={settings['become_driver_benefit_insurance'] || ''} onChange={e => set('become_driver_benefit_insurance', e.target.value)} rows={2} placeholder="Страховка пассажиров включена в каждую поездку" />
              </div>
              <SaveButton keys={['become_driver_benefit_earnings', 'become_driver_benefit_schedule', 'become_driver_benefit_support', 'become_driver_benefit_insurance']} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Шаги подключения</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="p-3 border rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Шаг {step}</p>
                  <div>
                    <Label>Заголовок</Label>
                    <Input
                      value={settings[`become_driver_step${step}_title`] || ''}
                      onChange={e => set(`become_driver_step${step}_title`, e.target.value)}
                      placeholder={['Регистрация', 'Проверка документов', 'Обучение', 'Первый заказ'][step - 1]}
                    />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea
                      value={settings[`become_driver_step${step}_desc`] || ''}
                      onChange={e => set(`become_driver_step${step}_desc`, e.target.value)}
                      rows={2}
                      placeholder={['Заполните анкету и загрузите документы', 'Менеджер проверит данные в течение 24 часов', 'Короткий инструктаж по приложению', 'Получите первый заказ и начните зарабатывать'][step - 1]}
                    />
                  </div>
                </div>
              ))}
              <SaveButton keys={['become_driver_step1_title', 'become_driver_step1_desc', 'become_driver_step2_title', 'become_driver_step2_desc', 'become_driver_step3_title', 'become_driver_step3_desc', 'become_driver_step4_title', 'become_driver_step4_desc']} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SiteSettingsManager;