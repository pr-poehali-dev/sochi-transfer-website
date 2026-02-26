import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface User {
  id: number;
  phone: string;
  name: string;
  email: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

const UsersManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', is_active: true, new_password: '' });
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const r = await fetch(`${API_URLS.users}&action=list`);
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone, is_active: user.is_active, new_password: '' });
    setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.phone) { toast({ title: 'Заполните обязательные поля', variant: 'destructive' }); return; }
    setSaving(true);
    const r = await fetch(API_URLS.users, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin_update', id: editing!.id, ...editForm })
    });
    if (r.ok) {
      toast({ title: 'Пользователь обновлён' });
      setEditDialog(false);
      loadUsers();
    } else {
      const d = await r.json();
      toast({ title: d.error || 'Ошибка', variant: 'destructive' });
    }
    setSaving(false);
  };

  const createUser = async () => {
    if (!createForm.name || !createForm.phone || !createForm.password) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    setSaving(true);
    const r = await fetch(API_URLS.users, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin_create', ...createForm })
    });
    const d = await r.json();
    if (r.ok) {
      toast({ title: 'Пользователь создан' });
      setCreateDialog(false);
      setCreateForm({ name: '', email: '', phone: '', password: '' });
      loadUsers();
    } else {
      toast({ title: d.error || 'Ошибка', variant: 'destructive' });
    }
    setSaving(false);
  };

  const blockUser = async (user: User) => {
    if (!confirm(`${user.is_active ? 'Заблокировать' : 'Разблокировать'} ${user.name}?`)) return;
    await fetch(API_URLS.users, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'admin_update', id: user.id, name: user.name, email: user.email, phone: user.phone, is_active: !user.is_active })
    });
    toast({ title: user.is_active ? 'Пользователь заблокирован' : 'Пользователь разблокирован' });
    loadUsers();
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle>Пользователи ({users.length})</CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Поиск по имени, телефону..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <Button className="gradient-primary text-white" onClick={() => setCreateDialog(true)}>
            <Icon name="Plus" className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Пользователей нет</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Баланс</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">#{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                    <TableCell className="font-medium">{parseFloat(String(user.balance || 0)).toFixed(0)} ₽</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'} className={user.is_active ? 'bg-green-500 text-white' : ''}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleDateString('ru')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Icon name="Pencil" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={user.is_active ? 'text-destructive' : 'text-green-600'} onClick={() => blockUser(user)}>
                          <Icon name={user.is_active ? 'Ban' : 'CheckCircle'} className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Имя <span className="text-red-500">*</span></Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Телефон <span className="text-red-500">*</span></Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Новый пароль (оставьте пустым чтобы не менять)</Label>
              <Input type="password" value={editForm.new_password} onChange={e => setEditForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Новый пароль..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm(f => ({ ...f, is_active: v }))} />
              <Label>Активен</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialog(false)}>Отмена</Button>
              <Button className="flex-1 gradient-primary text-white" onClick={saveEdit} disabled={saving}>
                {saving && <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />}
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Имя <span className="text-red-500">*</span></Label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Имя пользователя" />
            </div>
            <div>
              <Label>Телефон <span className="text-red-500">*</span></Label>
              <Input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7 (900) 000-00-00" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div>
              <Label>Пароль <span className="text-red-500">*</span></Label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Минимум 6 символов" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateDialog(false)}>Отмена</Button>
              <Button className="flex-1 gradient-primary text-white" onClick={createUser} disabled={saving}>
                {saving && <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" />}
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UsersManager;
