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
      </TabsContent>

      <TabsContent value="messengers">
        <Card>
          <CardHeader><CardTitle>Мессенджеры и контакты</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>WhatsApp номер (без +)</Label>
              <Input value={settings['whatsapp_number'] || ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="79001234567" />
            </div>
            <div>
              <Label>Telegram username (без @)</Label>
              <Input value={settings['telegram_username'] || ''} onChange={e => set('telegram_username', e.target.value)} placeholder="poehaliplus" />
            </div>
            <div>
              <Label>MAX (ВКонтакте) ссылка или username</Label>
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
            <SaveButton keys={['whatsapp_number', 'telegram_username', 'max_username', 'company_phone', 'company_email', 'company_address']} />
          </CardContent>
        </Card>
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
    </Tabs>
  );
};

export default SiteSettingsManager;
