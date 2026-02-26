import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface TransferType {
  id: number;
  value: string;
  label: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

interface CarClass {
  id: number;
  value: string;
  label: string;
  description: string;
  icon: string;
  price_multiplier: number;
  is_active: boolean;
  sort_order: number;
}

const ICONS = ['User', 'Users', 'Car', 'Bus', 'Briefcase', 'Star', 'Zap', 'Crown', 'Heart', 'Shield'];

const TransferClassesManager = () => {
  const { toast } = useToast();
  const [transferTypes, setTransferTypes] = useState<TransferType[]>([]);
  const [carClasses, setCarClasses] = useState<CarClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [ttDialog, setTtDialog] = useState(false);
  const [ccDialog, setCcDialog] = useState(false);
  const [editingTt, setEditingTt] = useState<TransferType | null>(null);
  const [editingCc, setEditingCc] = useState<CarClass | null>(null);
  const [saving, setSaving] = useState(false);

  const [ttForm, setTtForm] = useState({ value: '', label: '', description: '', icon: 'User', is_active: true, sort_order: 0 });
  const [ccForm, setCcForm] = useState({ value: '', label: '', description: '', icon: 'Car', price_multiplier: '1.00', is_active: true, sort_order: 0 });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [ttRes, ccRes] = await Promise.all([
      fetch(API_URLS.transferTypes),
      fetch(API_URLS.carClasses)
    ]);
    const ttData = await ttRes.json(); setTransferTypes(ttData.transfer_types || []);
    const ccData = await ccRes.json(); setCarClasses(ccData.car_classes || []);
    setLoading(false);
  };

  const openTtCreate = () => {
    setEditingTt(null);
    setTtForm({ value: '', label: '', description: '', icon: 'User', is_active: true, sort_order: transferTypes.length + 1 });
    setTtDialog(true);
  };

  const openTtEdit = (tt: TransferType) => {
    setEditingTt(tt);
    setTtForm({ value: tt.value, label: tt.label, description: tt.description, icon: tt.icon, is_active: tt.is_active, sort_order: tt.sort_order });
    setTtDialog(true);
  };

  const saveTt = async () => {
    if (!ttForm.label) { toast({ title: 'Заполните название', variant: 'destructive' }); return; }
    setSaving(true);
    const method = editingTt ? 'PUT' : 'POST';
    const body = editingTt ? { ...ttForm, id: editingTt.id } : ttForm;
    const r = await fetch(API_URLS.transferTypes, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { toast({ title: editingTt ? 'Тип обновлён' : 'Тип создан' }); setTtDialog(false); loadAll(); }
    else { toast({ title: 'Ошибка', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteTt = async (id: number) => {
    if (!confirm('Удалить тип трансфера?')) return;
    await fetch(`${API_URLS.transferTypes}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Удалено' }); loadAll();
  };

  const openCcCreate = () => {
    setEditingCc(null);
    setCcForm({ value: '', label: '', description: '', icon: 'Car', price_multiplier: '1.00', is_active: true, sort_order: carClasses.length + 1 });
    setCcDialog(true);
  };

  const openCcEdit = (cc: CarClass) => {
    setEditingCc(cc);
    setCcForm({ value: cc.value, label: cc.label, description: cc.description, icon: cc.icon, price_multiplier: String(cc.price_multiplier), is_active: cc.is_active, sort_order: cc.sort_order });
    setCcDialog(true);
  };

  const saveCc = async () => {
    if (!ccForm.label) { toast({ title: 'Заполните название', variant: 'destructive' }); return; }
    setSaving(true);
    const method = editingCc ? 'PUT' : 'POST';
    const body = editingCc
      ? { ...ccForm, id: editingCc.id, price_multiplier: parseFloat(ccForm.price_multiplier) }
      : { ...ccForm, price_multiplier: parseFloat(ccForm.price_multiplier) };
    const r = await fetch(API_URLS.carClasses, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { toast({ title: editingCc ? 'Класс обновлён' : 'Класс создан' }); setCcDialog(false); loadAll(); }
    else { toast({ title: 'Ошибка', variant: 'destructive' }); }
    setSaving(false);
  };

  const deleteCc = async (id: number) => {
    if (!confirm('Удалить класс автомобиля?')) return;
    await fetch(`${API_URLS.carClasses}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Удалено' }); loadAll();
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="transfer_types">
        <TabsList>
          <TabsTrigger value="transfer_types">
            <Icon name="Users" className="mr-2 h-4 w-4" />
            Типы трансфера
          </TabsTrigger>
          <TabsTrigger value="car_classes">
            <Icon name="Car" className="mr-2 h-4 w-4" />
            Классы авто
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer_types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Типы трансфера</CardTitle>
              <Button className="gradient-primary text-white" onClick={openTtCreate}>
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {transferTypes.map(tt => (
                    <div key={tt.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                          <Icon name={tt.icon as 'User'} className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{tt.label}</p>
                            <Badge variant={tt.is_active ? 'default' : 'secondary'} className={tt.is_active ? 'bg-green-500 text-white' : ''}>
                              {tt.is_active ? 'Активен' : 'Скрыт'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tt.description}</p>
                          <p className="text-xs text-muted-foreground">Код: {tt.value} · Порядок: {tt.sort_order}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openTtEdit(tt)}>
                          <Icon name="Pencil" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTt(tt.id)}>
                          <Icon name="Trash2" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="car_classes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Классы автомобилей</CardTitle>
              <Button className="gradient-primary text-white" onClick={openCcCreate}>
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {carClasses.map(cc => (
                    <div key={cc.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon name={cc.icon as 'Car'} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{cc.label}</p>
                            <Badge variant="outline">×{cc.price_multiplier}</Badge>
                            <Badge variant={cc.is_active ? 'default' : 'secondary'} className={cc.is_active ? 'bg-green-500 text-white' : ''}>
                              {cc.is_active ? 'Активен' : 'Скрыт'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{cc.description}</p>
                          <p className="text-xs text-muted-foreground">Код: {cc.value} · Множитель цены: ×{cc.price_multiplier}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openCcEdit(cc)}>
                          <Icon name="Pencil" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCc(cc.id)}>
                          <Icon name="Trash2" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Transfer Type */}
      <Dialog open={ttDialog} onOpenChange={setTtDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTt ? 'Редактировать тип' : 'Новый тип трансфера'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingTt && (
              <div>
                <Label>Код (латиница, без пробелов)</Label>
                <Input placeholder="individual" value={ttForm.value} onChange={e => setTtForm(f => ({ ...f, value: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Название</Label>
              <Input placeholder="Индивидуальный" value={ttForm.label} onChange={e => setTtForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <Label>Описание</Label>
              <Input placeholder="Только ваша группа" value={ttForm.description} onChange={e => setTtForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Иконка</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICONS.map(ic => (
                  <button key={ic} type="button"
                    onClick={() => setTtForm(f => ({ ...f, icon: ic }))}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${ttForm.icon === ic ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <Icon name={ic as 'User'} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Порядок сортировки</Label>
              <Input type="number" value={ttForm.sort_order} onChange={e => setTtForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ttForm.is_active} onCheckedChange={v => setTtForm(f => ({ ...f, is_active: v }))} />
              <Label>Активен</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setTtDialog(false)}>Отмена</Button>
              <Button className="flex-1 gradient-primary text-white" onClick={saveTt} disabled={saving}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Car Class */}
      <Dialog open={ccDialog} onOpenChange={setCcDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCc ? 'Редактировать класс' : 'Новый класс авто'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingCc && (
              <div>
                <Label>Код (латиница, без пробелов)</Label>
                <Input placeholder="economy" value={ccForm.value} onChange={e => setCcForm(f => ({ ...f, value: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Название</Label>
              <Input placeholder="Эконом" value={ccForm.label} onChange={e => setCcForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <Label>Описание</Label>
              <Input placeholder="Бюджетный класс" value={ccForm.description} onChange={e => setCcForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Иконка</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICONS.map(ic => (
                  <button key={ic} type="button"
                    onClick={() => setCcForm(f => ({ ...f, icon: ic }))}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${ccForm.icon === ic ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <Icon name={ic as 'Car'} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Множитель цены (1.00 = базовая цена)</Label>
              <Input type="number" step="0.1" min="0.5" max="5" value={ccForm.price_multiplier} onChange={e => setCcForm(f => ({ ...f, price_multiplier: e.target.value }))} />
            </div>
            <div>
              <Label>Порядок сортировки</Label>
              <Input type="number" value={ccForm.sort_order} onChange={e => setCcForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ccForm.is_active} onCheckedChange={v => setCcForm(f => ({ ...f, is_active: v }))} />
              <Label>Активен</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCcDialog(false)}>Отмена</Button>
              <Button className="flex-1 gradient-primary text-white" onClick={saveCc} disabled={saving}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransferClassesManager;
