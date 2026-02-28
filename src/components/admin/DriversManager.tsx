import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  car_brand: string;
  car_model: string;
  car_color: string;
  car_number: string;
  status: string;
  is_active: boolean;
  is_online: boolean;
  balance: number;
  commission_rate: number;
  rating: number;
  total_orders: number;
  created_at: string;
  driver_type?: string;
  car_category?: string;
  identity_verified?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'На проверке', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Активен', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-800' },
};

const DRIVER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  transfer: { label: 'Трансфер', color: 'bg-blue-100 text-blue-700' },
  rideshare: { label: 'Попутчик', color: 'bg-purple-100 text-purple-700' },
};

const DriversManager = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [commission, setCommission] = useState('15');
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'transfer' | 'rideshare'>('all');

  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', password: 'driver123', car_brand: '', car_model: '', car_color: '', car_number: '' });
  const [addLoading, setAddLoading] = useState(false);

  const [limitDialog, setLimitDialog] = useState(false);
  const [regLimit, setRegLimit] = useState('');
  const [regEnabled, setRegEnabled] = useState(true);

  useEffect(() => { loadDrivers(); loadLimit(); }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.drivers}&action=list`);
      const data = await r.json();
      setDrivers(data.drivers || []);
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const loadLimit = async () => {
    try {
      const r = await fetch(API_URLS.settings);
      const d = await r.json();
      const s = d.settings || {};
      setRegLimit(s['driver_registration_limit'] || '');
      setRegEnabled(s['driver_registration_enabled'] !== 'false');
    } catch { /* silent */ }
  };

  const saveLimit = async () => {
    try {
      await fetch(API_URLS.settings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { driver_registration_limit: regLimit, driver_registration_enabled: String(regEnabled) } })
      });
      toast({ title: 'Настройки регистрации сохранены' });
      setLimitDialog(false);
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const openDriver = (d: Driver) => {
    setSelected(d);
    setCommission(String(d.commission_rate));
  };

  const approve = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(API_URLS.drivers, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', driver_id: selected.id, status, commission_rate: parseFloat(commission) })
      });
      toast({ title: status === 'approved' ? 'Водитель одобрен' : 'Водитель отклонён' });
      setSelected(null);
      loadDrivers();
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const setCommissionRate = async () => {
    if (!selected) return;
    await fetch(API_URLS.drivers, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_commission', driver_id: selected.id, commission_rate: parseFloat(commission) })
    });
    toast({ title: 'Комиссия обновлена' });
    loadDrivers();
  };

  const addDriver = async () => {
    if (!addForm.name || !addForm.phone) {
      toast({ title: 'Укажите имя и телефон', variant: 'destructive' }); return;
    }
    setAddLoading(true);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_create', ...addForm })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: `Водитель создан! Пароль: ${d.password || addForm.password}` });
      setAddDialog(false);
      setAddForm({ name: '', phone: '', email: '', password: 'driver123', car_brand: '', car_model: '', car_color: '', car_number: '' });
      loadDrivers();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
    setAddLoading(false);
  };

  const pendingCount = drivers.filter(d => d.status === 'pending').length;
  const filteredDrivers = typeFilter === 'all' ? drivers : drivers.filter(d => (d.driver_type || 'transfer') === typeFilter);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              Водители
              {pendingCount > 0 && (
                <Badge className="bg-yellow-500 text-white">{pendingCount} на проверке</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLimitDialog(true)}>
                <Icon name="Settings" className="h-4 w-4 mr-1" />
                Лимит регистрации
              </Button>
              <Button size="sm" className="gradient-primary text-white" onClick={() => setAddDialog(true)}>
                <Icon name="Plus" className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'transfer', 'rideshare'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${typeFilter === t ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                {t === 'all' ? `Все (${drivers.length})` : t === 'transfer' ? `Трансфер (${drivers.filter(d => (d.driver_type||'transfer')==='transfer').length})` : `Попутчики (${drivers.filter(d => d.driver_type==='rideshare').length})`}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredDrivers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Водителей нет</p>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openDriver(d)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{d.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[d.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[d.status]?.label || d.status}
                      </span>
                      {d.driver_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${DRIVER_TYPE_LABELS[d.driver_type]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {DRIVER_TYPE_LABELS[d.driver_type]?.label || d.driver_type}
                        </span>
                      )}
                      {d.identity_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Верифицирован</span>}
                      {d.is_online && <span className="w-2 h-2 rounded-full bg-green-500" title="На линии" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{d.phone} · {d.car_brand} {d.car_model} · {d.car_number}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>★ {Number(d.rating).toFixed(1)}</span>
                      <span>{d.total_orders} заказов</span>
                      <span>Комиссия: {d.commission_rate}%</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог детального просмотра водителя */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Водитель: {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {selected.driver_type && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${DRIVER_TYPE_LABELS[selected.driver_type]?.color || 'bg-gray-100'}`}>
                    {DRIVER_TYPE_LABELS[selected.driver_type]?.label || selected.driver_type}
                  </span>
                )}
                {selected.identity_verified && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ Личность подтверждена</span>}
                {selected.car_category && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{selected.car_category === 'minivan' ? 'Минивэн' : 'Седан'}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Телефон:</span><br />{selected.phone}</div>
                <div><span className="text-muted-foreground">Email:</span><br />{selected.email || '—'}</div>
                <div><span className="text-muted-foreground">Автомобиль:</span><br />{selected.car_brand} {selected.car_model}</div>
                <div><span className="text-muted-foreground">Номер:</span><br /><span className="font-mono">{selected.car_number}</span></div>
                <div><span className="text-muted-foreground">Цвет:</span><br />{selected.car_color}</div>
                <div><span className="text-muted-foreground">Баланс:</span><br />{Number(selected.balance).toFixed(2)} ₽</div>
                <div><span className="text-muted-foreground">Заказов:</span><br />{selected.total_orders}</div>
                <div><span className="text-muted-foreground">Рейтинг:</span><br />★ {Number(selected.rating).toFixed(1)}</div>
              </div>

              <div>
                <Label>Комиссия платформы (%)</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" min="0" max="50" value={commission} onChange={e => setCommission(e.target.value)} />
                  <Button variant="outline" onClick={setCommissionRate}>Сохранить</Button>
                </div>
              </div>

              {selected.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => approve('approved')} disabled={saving}>
                    <Icon name="CheckCircle2" className="mr-2 h-4 w-4" />
                    Одобрить
                  </Button>
                  <Button className="flex-1" variant="destructive" onClick={() => approve('rejected')} disabled={saving}>
                    <Icon name="XCircle" className="mr-2 h-4 w-4" />
                    Отклонить
                  </Button>
                </div>
              )}
              {selected.status === 'approved' && (
                <Button className="w-full" variant="destructive" onClick={() => approve('rejected')} disabled={saving}>
                  Заблокировать водителя
                </Button>
              )}
              {selected.status === 'rejected' && (
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => approve('approved')} disabled={saving}>
                  Восстановить водителя
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог добавления водителя */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить водителя</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Имя *</Label>
                <Input className="mt-1" placeholder="Иван Иванов" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Телефон *</Label>
                <Input className="mt-1" placeholder="+7 (900) 000-00-00" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input className="mt-1" type="email" placeholder="driver@mail.ru" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Пароль</Label>
                <Input className="mt-1" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <Label>Марка авто</Label>
                <Input className="mt-1" placeholder="Toyota" value={addForm.car_brand} onChange={e => setAddForm(f => ({ ...f, car_brand: e.target.value }))} />
              </div>
              <div>
                <Label>Модель</Label>
                <Input className="mt-1" placeholder="Camry" value={addForm.car_model} onChange={e => setAddForm(f => ({ ...f, car_model: e.target.value }))} />
              </div>
              <div>
                <Label>Цвет</Label>
                <Input className="mt-1" placeholder="Белый" value={addForm.car_color} onChange={e => setAddForm(f => ({ ...f, car_color: e.target.value }))} />
              </div>
              <div>
                <Label>Гос. номер</Label>
                <Input className="mt-1" placeholder="А123ВС123" value={addForm.car_number} onChange={e => setAddForm(f => ({ ...f, car_number: e.target.value }))} />
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              Водитель будет сразу активирован (статус "Активен").
            </div>
            <Button className="w-full gradient-primary text-white" onClick={addDriver} disabled={addLoading}>
              {addLoading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
              Создать водителя
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог лимита регистрации */}
      <Dialog open={limitDialog} onOpenChange={setLimitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Лимит регистрации водителей</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <button
                onClick={() => setRegEnabled(!regEnabled)}
                className={`relative w-10 h-6 rounded-full transition-colors ${regEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${regEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm font-medium">{regEnabled ? 'Регистрация открыта' : 'Регистрация закрыта'}</p>
                <p className="text-xs text-muted-foreground">Разрешить новым водителям регистрироваться</p>
              </div>
            </div>
            <div>
              <Label>Максимальное количество водителей</Label>
              <Input className="mt-1" type="number" min="0" placeholder="0 — без лимита" value={regLimit}
                onChange={e => setRegLimit(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">0 или пусто — без ограничений</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Сейчас зарегистрировано: <strong>{drivers.length}</strong> водителей
            </div>
            <Button className="w-full gradient-primary text-white" onClick={saveLimit}>
              Сохранить настройки
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DriversManager;