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
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'На проверке', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Активен', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-800' },
};

const DriversManager = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [commission, setCommission] = useState('15');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.drivers}&action=list`);
      const data = await r.json();
      setDrivers(data.drivers || []);
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setLoading(false); }
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

  const pendingCount = drivers.filter(d => d.status === 'pending').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Водители
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500 text-white">{pendingCount} на проверке</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
          ) : drivers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Водителей нет</p>
          ) : (
            <div className="space-y-3">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openDriver(d)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{d.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[d.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[d.status]?.label || d.status}
                      </span>
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

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Водитель: {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
    </>
  );
};

export default DriversManager;
