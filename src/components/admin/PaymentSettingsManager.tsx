import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  { value: 'none', label: 'Без онлайн-оплаты', description: 'Наличные / перевод при встрече' },
  { value: 'yookassa', label: 'ЮКасса', description: 'Популярный российский провайдер' },
  { value: 'robokassa', label: 'Робокасса', description: 'Онлайн-касса для бизнеса' },
  { value: 'tinkoff', label: 'Тинькофф', description: 'Тинькофф Эквайринг' },
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URLS.paymentSettings);
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить настройки' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(API_URLS.paymentSettings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast({ title: 'Сохранено', description: 'Настройки оплаты обновлены' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить настройки' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Icon name="Loader2" className="h-6 w-6 animate-spin" /></div>;

  const selectedProvider = PROVIDERS.find(p => p.value === settings.payment_provider);

  return (
    <div className="space-y-6">
      {/* Режимы оплаты */}
      <Card>
        <CardHeader>
          <CardTitle>Режимы оплаты</CardTitle>
          <CardDescription>Выберите доступные варианты оплаты для клиентов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/30 transition-colors">
            <div>
              <p className="font-semibold">Полная оплата</p>
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
                <Input
                  type="number"
                  min="5"
                  max="90"
                  value={settings.prepay_percent}
                  onChange={(e) => setSettings(p => ({ ...p, prepay_percent: parseInt(e.target.value) || 30 }))}
                  className="w-24"
                />
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

      {/* Провайдер оплаты */}
      <Card>
        <CardHeader>
          <CardTitle>Модуль онлайн-оплаты</CardTitle>
          <CardDescription>Подключите платёжный шлюз для приёма оплат онлайн</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROVIDERS.map(provider => (
              <button
                key={provider.value}
                onClick={() => setSettings(p => ({ ...p, payment_provider: provider.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  settings.payment_provider === provider.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{provider.label}</p>
                  {settings.payment_provider === provider.value && (
                    <Badge className="gradient-primary text-white border-0 text-xs">Выбран</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </button>
            ))}
          </div>

          {settings.payment_provider !== 'none' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label>Публичный ключ (Shop ID / Merchant ID)</Label>
                <Input
                  placeholder={`Ключ от ${selectedProvider?.label}`}
                  value={settings.provider_public_key}
                  onChange={(e) => setSettings(p => ({ ...p, provider_public_key: e.target.value }))}
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Требуется настройка</p>
                    <p className="text-xs text-amber-700">Секретный ключ провайдера необходимо добавить через раздел «Секреты» в настройках проекта. Не вводите секретный ключ здесь.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="gradient-primary text-white">
        {isSaving ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить настройки</>}
      </Button>
    </div>
  );
};

export default PaymentSettingsManager;
