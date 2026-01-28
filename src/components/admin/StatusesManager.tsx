import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Status {
  id: number;
  name: string;
  color: string;
}

const StatusesManager = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#8B5CF6' });
  const { toast } = useToast();

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const response = await fetch(API_URLS.statuses);
      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить статусы' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingStatus ? 'PUT' : 'POST';
      const body = editingStatus ? { ...formData, id: editingStatus.id } : formData;

      const response = await fetch(API_URLS.statuses, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: editingStatus ? 'Статус обновлен' : 'Статус создан' });
        setIsDialogOpen(false);
        resetForm();
        loadStatuses();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить статус' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот статус? Все заявки с этим статусом будут затронуты.')) return;

    try {
      const response = await fetch(`${API_URLS.statuses}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Статус удален' });
        loadStatuses();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить статус' });
    }
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setFormData({ name: status.name, color: status.color });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStatus(null);
    setFormData({ name: '', color: '#8B5CF6' });
  };

  const colorPresets = [
    { name: 'Фиолетовый', value: '#8B5CF6' },
    { name: 'Синий', value: '#0EA5E9' },
    { name: 'Оранжевый', value: '#F97316' },
    { name: 'Зеленый', value: '#10B981' },
    { name: 'Красный', value: '#EF4444' },
    { name: 'Розовый', value: '#D946EF' },
    { name: 'Желтый', value: '#FACC15' },
    { name: 'Серый', value: '#6B7280' }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Управление статусами</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white">
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить статус
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Редактировать статус' : 'Новый статус'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Название статуса</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`h-10 rounded border-2 transition-all ${formData.color === preset.value ? 'border-primary scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: preset.value }}
                      onClick={() => setFormData({ ...formData, color: preset.value })}
                      title={preset.name}
                    />
                  ))}
                </div>
                <Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Предпросмотр:</p>
                <Badge style={{ backgroundColor: formData.color }} className="text-white border-0 px-4 py-2">
                  {formData.name || 'Название статуса'}
                </Badge>
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">Сохранить</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Предпросмотр</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell className="font-medium">{status.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border" style={{ backgroundColor: status.color }} />
                    <span className="text-sm text-muted-foreground">{status.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: status.color }} className="text-white border-0">
                    {status.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(status)}>
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(status.id)} className="hover:text-destructive">
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StatusesManager;
