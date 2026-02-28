import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Manager {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  permissions: Record<string, boolean>;
  last_login?: string;
  created_at: string;
}

const ALL_PERMISSIONS: { key: string; label: string; icon: string }[] = [
  { key: 'orders', label: 'Заявки', icon: 'ShoppingCart' },
  { key: 'drivers', label: 'Водители', icon: 'Car' },
  { key: 'tariffs', label: 'Тарифы', icon: 'MapPin' },
  { key: 'fleet', label: 'Автопарк', icon: 'Truck' },
  { key: 'reviews', label: 'Отзывы', icon: 'Star' },
  { key: 'news', label: 'Новости', icon: 'Newspaper' },
  { key: 'statuses', label: 'Статусы', icon: 'Tag' },
  { key: 'payment', label: 'Оплата', icon: 'CreditCard' },
  { key: 'finance', label: 'Финансы', icon: 'Wallet' },
  { key: 'users', label: 'Пользователи', icon: 'Users' },
  { key: 'settings', label: 'Настройки', icon: 'Settings' },
];

const DEFAULT_MANAGER_PERMISSIONS: Record<string, boolean> = {
  orders: true, drivers: true, tariffs: false, fleet: false,
  reviews: true, news: false, statuses: false, payment: false,
  finance: false, users: false, settings: false,
};

const ManagersManager = () => {
  const { toast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Manager | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'manager',
    permissions: { ...DEFAULT_MANAGER_PERMISSIONS },
  });

  useEffect(() => { loadManagers(); }, []);

  const loadManagers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.managers}&action=managers`);
      const d = await r.json();
      setManagers(d.managers || []);
    } catch { toast({ title: 'Ошибка загрузки', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'manager', permissions: { ...DEFAULT_MANAGER_PERMISSIONS } });
    setAddDialog(true);
  };

  const openEdit = (m: Manager) => {
    setSelected(m);
    setForm({
      name: m.name, email: m.email, password: '', role: m.role,
      permissions: { ...DEFAULT_MANAGER_PERMISSIONS, ...(m.permissions || {}) },
    });
    setEditDialog(true);
  };

  const togglePerm = (key: string) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  const addManager = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'Заполните имя, email и пароль', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch(API_URLS.managers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_manager', ...form }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Менеджер создан!' });
      setAddDialog(false);
      loadManagers();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
    setSaving(false);
  };

  const updateManager = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        action: 'update_manager', id: selected.id, name: form.name,
        role: form.role, is_active: selected.is_active, permissions: form.permissions,
      };
      if (form.password) body.new_password = form.password;
      const r = await fetch(API_URLS.managers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Менеджер обновлён' });
      setEditDialog(false);
      loadManagers();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleActive = async (m: Manager) => {
    await fetch(API_URLS.managers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_manager', id: m.id, name: m.name, role: m.role, is_active: !m.is_active, permissions: m.permissions }),
    });
    toast({ title: m.is_active ? 'Деактивирован' : 'Активирован' });
    loadManagers();
  };

  const PermissionsGrid = ({ perms, onToggle }: { perms: Record<string, boolean>; onToggle: (k: string) => void }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {ALL_PERMISSIONS.map(p => (
        <button key={p.key} onClick={() => onToggle(p.key)}
          className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-sm transition-all ${perms[p.key] ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-muted-foreground/30 text-muted-foreground'}`}>
          <Icon name={p.icon as 'Star'} className="h-4 w-4 flex-shrink-0" />
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Менеджеры и модераторы</CardTitle>
              <CardDescription>Управление доступом сотрудников к панели администратора</CardDescription>
            </div>
            <Button className="gradient-primary text-white" onClick={openAdd}>
              <Icon name="Plus" className="h-4 w-4 mr-2" />Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
          ) : managers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Менеджеров нет</p>
          ) : (
            <div className="space-y-3">
              {managers.map(m => (
                <div key={m.id} className="p-4 border rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold">{m.name}</span>
                        <Badge variant={m.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {m.role === 'admin' ? 'Администратор' : 'Менеджер'}
                        </Badge>
                        <Badge variant={m.is_active ? 'outline' : 'destructive'} className="text-xs">
                          {m.is_active ? 'Активен' : 'Заблокирован'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{m.email}</p>
                      {m.permissions && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ALL_PERMISSIONS.filter(p => m.permissions?.[p.key]).map(p => (
                            <span key={p.key} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                        <Icon name="Edit" className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant={m.is_active ? 'destructive' : 'outline'} onClick={() => toggleActive(m)}>
                        <Icon name={m.is_active ? 'UserX' : 'UserCheck'} className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог добавления */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Добавить менеджера</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Имя *</Label>
                <Input className="mt-1" placeholder="Иван Иванов" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Email *</Label>
                <Input className="mt-1" type="email" placeholder="manager@company.ru" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Пароль *</Label>
                <Input className="mt-1" type="password" placeholder="Минимум 6 символов" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <Label>Роль</Label>
                <div className="flex gap-2 mt-1">
                  {['manager', 'moderator'].map(r => (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${form.role === r ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                      {r === 'manager' ? 'Менеджер' : 'Модератор'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Доступные разделы</Label>
              <PermissionsGrid perms={form.permissions} onToggle={togglePerm} />
            </div>
            <Button className="w-full gradient-primary text-white" onClick={addManager} disabled={saving}>
              {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
              Создать менеджера
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактировать: {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Имя</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Новый пароль (оставьте пустым чтобы не менять)</Label>
                <Input className="mt-1" type="password" placeholder="Новый пароль" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Доступные разделы</Label>
              <PermissionsGrid perms={form.permissions} onToggle={togglePerm} />
            </div>
            <Button className="w-full gradient-primary text-white" onClick={updateManager} disabled={saving}>
              {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManagersManager;
