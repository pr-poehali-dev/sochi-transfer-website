import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Tariff {
  id: number;
  city: string;
  price: number;
  distance: string;
  duration: string;
  image_emoji: string;
  image_url: string | null;
  is_active: boolean;
}

interface TariffsManagerProps {
  onUpdate: () => void;
}

const TariffsManager = ({ onUpdate }: TariffsManagerProps) => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [formData, setFormData] = useState({
    city: '',
    price: '',
    distance: '',
    duration: '',
    image_emoji: '🚗',
    is_active: true,
    image_base64: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const response = await fetch(API_URLS.tariffs);
      const data = await response.json();
      setTariffs(data.tariffs || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить тарифы' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTariff ? API_URLS.tariffs : API_URLS.tariffs;
      const method = editingTariff ? 'PUT' : 'POST';
      const body = editingTariff
        ? { ...formData, id: editingTariff.id, price: parseInt(formData.price) }
        : { ...formData, price: parseInt(formData.price) };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: editingTariff ? 'Тариф обновлен' : 'Тариф создан' });
        setIsDialogOpen(false);
        resetForm();
        loadTariffs();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить тариф' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот тариф?')) return;

    try {
      const response = await fetch(`${API_URLS.tariffs}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Тариф удален' });
        loadTariffs();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить тариф' });
    }
  };

  const handleEdit = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setFormData({
      city: tariff.city,
      price: tariff.price.toString(),
      distance: tariff.distance || '',
      duration: tariff.duration || '',
      image_emoji: tariff.image_emoji,
      is_active: tariff.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTariff(null);
    setFormData({ city: '', price: '', distance: '', duration: '', image_emoji: '🚗', is_active: true, image_base64: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData(f => ({ ...f, image_base64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Управление тарифами</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white">
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить тариф
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTariff ? 'Редактировать тариф' : 'Новый тариф'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Город</Label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цена (₽)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Эмодзи (если нет фото)</Label>
                  <Input value={formData.image_emoji} onChange={(e) => setFormData({ ...formData, image_emoji: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Фото направления</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {formData.image_base64 && <p className="text-xs text-green-600">✓ Изображение выбрано</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Расстояние</Label>
                  <Input placeholder="25 км" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Время</Label>
                  <Input placeholder="35 мин" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Активен</Label>
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
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
              <TableHead>Город</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Расстояние</TableHead>
              <TableHead>Время</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffs.map((tariff) => (
              <TableRow key={tariff.id}>
                <TableCell className="font-medium">
                  {tariff.image_url ? (
                    <img src={tariff.image_url} alt={tariff.city} className="w-8 h-8 rounded object-cover inline-block mr-2" />
                  ) : (
                    <span className="mr-2">{tariff.image_emoji}</span>
                  )}
                  {tariff.city}
                </TableCell>
                <TableCell>{tariff.price} ₽</TableCell>
                <TableCell>{tariff.distance}</TableCell>
                <TableCell>{tariff.duration}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${tariff.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {tariff.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(tariff)}>
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tariff.id)} className="hover:text-destructive">
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

export default TariffsManager;