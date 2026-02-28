import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface PaymentSettings {
  allow_prepay: boolean;
  prepay_percent: number;
  allow_full_payment: boolean;
  payment_provider: string;
  provider_public_key: string;
}

const PROVIDERS = [
  { value: 'none', label: 'Наличные / перевод', description: 'Оплата при встрече без онлайн-шлюза', icon: 'Banknote' },
  { value: 'yookassa', label: 'ЮКасса', description: 'Популярный российский провайдер', icon: 'CreditCard' },
  { value: 'robokassa', label: 'Робокасса', description: 'Онлайн-касса для бизнеса', icon: 'Building2' },
];

const PaymentSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PaymentSettings>({
    allow_prepay: true,
    prepay_percent: 30,
    allow_full_payment: true,
    payment_provider: 'none',
    provider_public_key: '',
  });
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);

  const [integrations, setIntegrations] = useState({
    yookassa_shop_id: '',
    robokassa_login: '',
    robokassa_test_mode: 'true',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: '',
    email_notify_new_order: 'true',
    email_notify_to: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [payRes, siteRes] = await Promise.all([
        fetch(API_URLS.paymentSettings),
        fetch(API_URLS.settings),
      ]);
      const payData = await payRes.json();
      if (payData.settings) setSettings(payData.settings);
      const siteData = await siteRes.json();
      const s = siteData.settings || {};
      setSiteSettings(s);
      setIntegrations({
        yookassa_shop_id: s['yookassa_shop_id'] || '',
        robokassa_login: s['robokassa_login'] || '',
        robokassa_test_mode: s['robokassa_test_mode'] || 'true',
        smtp_host: s['smtp_host'] || '',
        smtp_port: s['smtp_port'] || '587',
        smtp_user: s['smtp_user'] || '',
        smtp_from: s['smtp_from'] || '',
        email_notify_new_order: s['email_notify_new_order'] || 'true',
        email_notify_to: s['email_notify_to'] || '',
      });
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка загрузки настроек' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayment = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(API_URLS.paymentSettings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast({ title: 'Настройки оплаты сохранены' });
      else toast({ variant: 'destructive', title: 'Ошибка сохранения' });
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSavingIntegrations(true);
    try {
      await fetch(API_URLS.settings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: integrations }),
      });
      toast({ title: 'Настройки интеграций сохранены' });
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка сохранения' });
    } finally {
      setIsSavingIntegrations(false);
    }
  };

  const setInt = (key: string, value: string) => setIntegrations(s => ({ ...s, [key]: value }));

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <Icon name="Loader2" className="h-6 w-6 animate-spin" />
    </div>
  );

  return (
    <Tabs defaultValue="payment" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="payment">Способы оплаты</TabsTrigger>
        <TabsTrigger value="yookassa">ЮКасса</TabsTrigger>
        <TabsTrigger value="robokassa">Робокасса</TabsTrigger>
        <TabsTrigger value="email">Email-уведомления</TabsTrigger>
      </TabsList>

      {/* === СПОСОБЫ ОПЛАТЫ === */}
      <TabsContent value="payment" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Режимы оплаты</CardTitle>
            <CardDescription>Выберите доступные варианты оплаты для клиентов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/30 transition-colors">
              <div>
                <p className="font-semibold">Полная оплата онлайн</p>
                <p className="text-sm text-muted-foreground">Клиент оплачивает 100% стоимости</p>
              </div>
              <Switch
                checked={settings.allow_full_payment}
                onCheckedChange={(v) => setSettings(p => ({ ...p, allow_full_payment: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/30 transition-colors">
              <div>
                <p className="font-semibold">Предоплата</p>
                <p className="text-sm text-muted-foreground">Клиент оплачивает часть суммы, остаток — при посадке</p>
              </div>
              <Switch
                checked={settings.allow_prepay}
                onCheckedChange={(v) => setSettings(p => ({ ...p, allow_prepay: v }))}
              />
            </div>

            {settings.allow_prepay && (
              <div className="ml-4 p-4 bg-muted/50 rounded-xl space-y-2">
                <Label>Размер предоплаты (%)</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" min="5" max="90" value={settings.prepay_percent}
                    onChange={(e) => setSettings(p => ({ ...p, prepay_percent: parseInt(e.target.value) || 30 }))}
                    className="w-24" />
                  <span className="text-sm text-muted-foreground">% от суммы заказа</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[20, 30, 50].map(pct => (
                    <Button key={pct} size="sm" variant={settings.prepay_percent === pct ? 'default' : 'outline'}
                      onClick={() => setSettings(p => ({ ...p, prepay_percent: pct }))}>
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Платёжный шлюз</CardTitle>
            <CardDescription>Выберите провайдер для онлайн-оплаты</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROVIDERS.map(provider => (
                <button key={provider.value}
                  onClick={() => setSettings(p => ({ ...p, payment_provider: provider.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.payment_provider === provider.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon name={provider.icon as 'CreditCard'} className="h-5 w-5 text-primary" />
                    {settings.payment_provider === provider.value && (
                      <Badge className="gradient-primary text-white border-0 text-xs">Активен</Badge>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{provider.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSavePayment} disabled={isSaving} className="gradient-primary text-white">
          {isSaving ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить</>}
        </Button>
      </TabsContent>

      {/* === ЮКАССА === */}
      <TabsContent value="yookassa" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="CreditCard" className="h-5 w-5" />
              ЮКасса
            </CardTitle>
            <CardDescription>Настройка интеграции с платёжной системой ЮКасса</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Как подключить ЮКассу:</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Зарегистрируйтесь на <strong>yookassa.ru</strong></li>
                <li>В личном кабинете: Настройки → Ключи API</li>
                <li>Скопируйте Shop ID и Секретный ключ</li>
                <li>Введите Shop ID ниже, Секретный ключ — в поле "Секрет" справа</li>
              </ol>
            </div>

            <div>
              <Label>Shop ID (магазин)</Label>
              <Input className="mt-1" placeholder="123456"
                value={integrations.yookassa_shop_id}
                onChange={e => setInt('yookassa_shop_id', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Найти в ЮКасса: Настройки → Общие</p>
            </div>

            <div className="p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50">
              <div className="flex items-start gap-3">
                <Icon name="Key" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Секретный ключ ЮКасса</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Секретный ключ нельзя хранить в настройках. Добавьте его в раздел <strong>"Секреты проекта"</strong>:
                  </p>
                  <div className="mt-2 font-mono text-xs bg-amber-100 border border-amber-300 rounded p-2 text-amber-900">
                    Имя секрета: <strong>YOOKASSA_SECRET_KEY</strong><br />
                    Значение: ваш секретный ключ из ЮКасса
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Статус ЮКасса:</p>
              <div className="flex items-center gap-2">
                {integrations.yookassa_shop_id ? (
                  <><Badge className="bg-green-500 text-white">Shop ID настроен</Badge>
                  <span className="text-xs text-muted-foreground">Осталось добавить секрет YOOKASSA_SECRET_KEY</span></>
                ) : (
                  <Badge variant="outline">Не настроена</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-primary text-white">
          {isSavingIntegrations ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить</>}
        </Button>
      </TabsContent>

      {/* === РОБОКАССА === */}
      <TabsContent value="robokassa" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Building2" className="h-5 w-5" />
              Робокасса
            </CardTitle>
            <CardDescription>Настройка интеграции с Робокасса</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">Как подключить Робокассу:</p>
              <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                <li>Зарегистрируйтесь на <strong>robokassa.ru</strong></li>
                <li>Создайте магазин (логин магазина)</li>
                <li>В настройках получите Password1 и Password2</li>
                <li>Введите Login ниже, Password1/Password2 — в секреты проекта</li>
              </ol>
            </div>

            <div>
              <Label>Логин магазина (MerchantLogin)</Label>
              <Input className="mt-1" placeholder="my_shop_login"
                value={integrations.robokassa_login}
                onChange={e => setInt('robokassa_login', e.target.value)} />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <button onClick={() => setInt('robokassa_test_mode', integrations.robokassa_test_mode === 'true' ? 'false' : 'true')}
                className={`relative w-10 h-6 rounded-full transition-colors ${integrations.robokassa_test_mode === 'true' ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${integrations.robokassa_test_mode === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm font-medium">{integrations.robokassa_test_mode === 'true' ? 'Тестовый режим' : 'Боевой режим'}</p>
                <p className="text-xs text-muted-foreground">{integrations.robokassa_test_mode === 'true' ? 'Платежи не списываются реально' : 'Реальные платежи'}</p>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50">
              <div className="flex items-start gap-3">
                <Icon name="Key" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Секретные пароли Робокасса</p>
                  <p className="text-xs text-amber-700 mt-1">Добавьте в раздел <strong>"Секреты проекта"</strong>:</p>
                  <div className="mt-2 font-mono text-xs bg-amber-100 border border-amber-300 rounded p-2 text-amber-900 space-y-1">
                    <div><strong>ROBOKASSA_PASSWORD1</strong> — Password1 из настроек</div>
                    <div><strong>ROBOKASSA_PASSWORD2</strong> — Password2 из настроек</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Статус Робокасса:</p>
              {integrations.robokassa_login ? (
                <Badge className="bg-green-500 text-white">Логин настроен</Badge>
              ) : (
                <Badge variant="outline">Не настроена</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-primary text-white">
          {isSavingIntegrations ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить</>}
        </Button>
      </TabsContent>

      {/* === EMAIL УВЕДОМЛЕНИЯ === */}
      <TabsContent value="email" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Mail" className="h-5 w-5" />
              Email-уведомления
            </CardTitle>
            <CardDescription>Настройте отправку писем при новых заявках и событиях</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Настройка SMTP (бесплатно через Яндекс):</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Войдите в Яндекс.Почту → Настройки → Безопасность</li>
                <li>Включите "Пароли приложений", создайте новый</li>
                <li>SMTP: <strong>smtp.yandex.ru</strong>, порт <strong>587</strong></li>
                <li>Введите данные ниже, пароль приложения добавьте в секрет <strong>SMTP_PASSWORD</strong></li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label>SMTP сервер</Label>
                <Input className="mt-1" placeholder="smtp.yandex.ru"
                  value={integrations.smtp_host}
                  onChange={e => setInt('smtp_host', e.target.value)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Порт</Label>
                <Input className="mt-1" placeholder="587"
                  value={integrations.smtp_port}
                  onChange={e => setInt('smtp_port', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Логин (email отправителя)</Label>
                <Input className="mt-1" type="email" placeholder="info@yourdomain.ru"
                  value={integrations.smtp_user}
                  onChange={e => setInt('smtp_user', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Имя отправителя</Label>
                <Input className="mt-1" placeholder="ПоехалиПро"
                  value={integrations.smtp_from}
                  onChange={e => setInt('smtp_from', e.target.value)} />
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50">
              <div className="flex items-start gap-3">
                <Icon name="Key" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Пароль SMTP</p>
                  <p className="text-xs text-amber-700 mt-1">Добавьте пароль почты в <strong>"Секреты проекта"</strong>:</p>
                  <div className="mt-2 font-mono text-xs bg-amber-100 border border-amber-300 rounded p-2 text-amber-900">
                    <strong>SMTP_PASSWORD</strong> — пароль от почты / пароль приложения
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3">Когда отправлять письма:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Новая заявка на трансфер</p>
                    <p className="text-xs text-muted-foreground">Уведомление при каждом новом заказе</p>
                  </div>
                  <button onClick={() => setInt('email_notify_new_order', integrations.email_notify_new_order === 'true' ? 'false' : 'true')}
                    className={`relative w-10 h-6 rounded-full transition-colors ${integrations.email_notify_new_order === 'true' ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${integrations.email_notify_new_order === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label>Email для уведомлений</Label>
              <Input className="mt-1" type="email" placeholder="admin@yourcompany.ru"
                value={integrations.email_notify_to}
                onChange={e => setInt('email_notify_to', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">На этот адрес будут приходить уведомления о заявках</p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Статус email:</p>
              {integrations.smtp_host && integrations.smtp_user ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">SMTP настроен</Badge>
                  <span className="text-xs text-muted-foreground">Осталось добавить секрет SMTP_PASSWORD</span>
                </div>
              ) : (
                <Badge variant="outline">Не настроен</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-primary text-white">
          {isSavingIntegrations ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить настройки</>}
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default PaymentSettingsManager;
