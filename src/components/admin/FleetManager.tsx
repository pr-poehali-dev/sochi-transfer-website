import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Fleet {
  id: number;
  name: string;
  type: string;
  capacity: number;
  luggage_capacity: number;
  features: string[];
  image_url: string | null;
  image_emoji: string;
  is_active: boolean;
}

interface FleetManagerProps {
  onUpdate: () => void;
}

const FleetManager = ({ onUpdate }: FleetManagerProps) => {
  const [fleet, setFleet] = useState<Fleet[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Fleet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    luggage_capacity: '',
    features: '',
    image_url: '',
    image_emoji: '🚗',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      const response = await fetch(API_URLS.fleet);
      const data = await response.json();
      setFleet(data.fleet || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить автопарк' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingCar ? 'PUT' : 'POST';
      const features = formData.features.split('\n').filter(f => f.trim());
      const body = {
        ...(editingCar && { id: editingCar.id }),
        name: formData.name,
        type: formData.type,
        capacity: parseInt(formData.capacity),
        luggage_capacity: parseInt(formData.luggage_capacity),
        features,
        image_url: formData.image_url || null,
        image_emoji: formData.image_emoji,
        is_active: formData.is_active
      };

      const response = await fetch(API_URLS.fleet, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: editingCar ? 'Автомобиль обновлен' : 'Автомобиль добавлен' });
        setIsDialogOpen(false);
        resetForm();
        loadFleet();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить автомобиль' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот автомобиль?')) return;

    try {
      const response = await fetch(`${API_URLS.fleet}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Автомобиль удален' });
        loadFleet();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить автомобиль' });
    }
  };

  const handleEdit = (car: Fleet) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      type: car.type,
      capacity: car.capacity.toString(),
      luggage_capacity: car.luggage_capacity.toString(),
      features: car.features.join('\n'),
      image_url: car.image_url || '',
      image_emoji: car.image_emoji,
      is_active: car.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCar(null);
    setFormData({ name: '', type: '', capacity: '', luggage_capacity: '', features: '', image_url: '', image_emoji: '🚗', is_active: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Управление автопарком</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white">
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить автомобиль
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Класс</Label>
                  <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Пассажиров</Label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Багаж</Label>
                  <Input type="number" value={formData.luggage_capacity} onChange={(e) => setFormData({ ...formData, luggage_capacity: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Эмодзи</Label>
                  <Input value={formData.image_emoji} onChange={(e) => setFormData({ ...formData, image_emoji: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL изображения (опционально)</Label>
                <Input placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Особенности (каждая с новой строки)</Label>
                <Textarea rows={4} placeholder="Кондиционер\nWi-Fi\nUSB зарядка" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} />
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
              <TableHead>Автомобиль</TableHead>
              <TableHead>Класс</TableHead>
              <TableHead>Вместимость</TableHead>
              <TableHead>Особенности</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fleet.map((car) => (
              <TableRow key={car.id}>
                <TableCell className="font-medium">
                  <span className="text-2xl mr-2">{car.image_emoji}</span>
                  {car.name}
                </TableCell>
                <TableCell>{car.type}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div><Icon name="Users" className="inline h-3 w-3 mr-1" />{car.capacity}</div>
                    <div><Icon name="Luggage" className="inline h-3 w-3 mr-1" />{car.luggage_capacity}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {car.features.slice(0, 2).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                    {car.features.length > 2 && <Badge variant="outline" className="text-xs">+{car.features.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${car.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {car.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(car)}>
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(car.id)} className="hover:text-destructive">
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

export default FleetManager;
