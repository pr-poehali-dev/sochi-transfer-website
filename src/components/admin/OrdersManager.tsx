import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Order {
  id: number;
  from_location: string;
  to_location: string;
  pickup_datetime: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  flight_number?: string;
  price: number;
  prepay_amount?: number;
  payment_type?: string;
  transfer_type?: string;
  car_class?: string;
  passengers_count?: number;
  status_id?: number;
  status_name: string;
  status_color: string;
  tariff_city?: string;
  notes?: string;
  created_at: string;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface OrdersManagerProps {
  onUpdate: () => void;
}

const TRANSFER_LABELS: Record<string, string> = { individual: 'Индивидуальный', group: 'Групповой' };
const CAR_LABELS: Record<string, string> = { economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' };
const PAYMENT_LABELS: Record<string, string> = { full: 'Полная', prepay: 'Предоплата' };

const OrdersManager = ({ onUpdate }: OrdersManagerProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    loadStatuses();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(API_URLS.orders);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить заявки' });
    }
  };

  const loadStatuses = async () => {
    try {
      const response = await fetch(API_URLS.statuses);
      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error('Failed to load statuses:', error);
    }
  };

  const handleStatusChange = async (orderId: number, newStatusId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const response = await fetch(API_URLS.orders, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          status_id: newStatusId,
          price: order?.price,
          notes: ''
        })
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Статус заявки обновлен' });
        loadOrders();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить статус' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту заявку?')) return;

    try {
      const response = await fetch(`${API_URLS.orders}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Заявка удалена' });
        loadOrders();
        onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить заявку' });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Пассажир', 'Телефон', 'Email', 'Откуда', 'Куда', 'Дата подачи', 'Кол-во пасс.', 'Тип трансфера', 'Класс авто', 'Оплата', 'Цена', 'Статус', 'Создана'];
    const rows = orders.map(o => [
      o.id, o.passenger_name, o.passenger_phone, o.passenger_email,
      o.from_location, o.to_location,
      o.pickup_datetime ? formatDateTime(o.pickup_datetime) : '',
      o.passengers_count || 1,
      TRANSFER_LABELS[o.transfer_type || 'individual'] || '',
      CAR_LABELS[o.car_class || 'comfort'] || '',
      PAYMENT_LABELS[o.payment_type || 'full'] || '',
      o.price, o.status_name,
      o.created_at ? formatDateTime(o.created_at) : ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Заявки на трансфер</CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Icon name="Download" className="mr-2 h-4 w-4" />
            Экспорт CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Пассажир</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>Дата/Время</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{order.passenger_name}</div>
                      <div className="text-muted-foreground">{order.passenger_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order.from_location}</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Icon name="ArrowDown" className="h-3 w-3" />
                        {order.to_location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(order.pickup_datetime)}</TableCell>
                  <TableCell className="font-medium">{order.price} ₽</TableCell>
                  <TableCell>
                    <Select 
                      value={statuses.find(s => s.name === order.status_name)?.id.toString()} 
                      onValueChange={(value) => handleStatusChange(order.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue>
                          <Badge style={{ backgroundColor: order.status_color }} className="text-white border-0">
                            {order.status_name}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            <Badge style={{ backgroundColor: status.color }} className="text-white border-0">
                              {status.name}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }}>
                      <Icon name="Eye" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} className="hover:text-destructive">
                      <Icon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали заявки #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Пассажир</p>
                  <p className="text-lg">{selectedOrder.passenger_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                  <p className="text-lg">{selectedOrder.passenger_phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{selectedOrder.passenger_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Номер рейса</p>
                  <p className="text-lg">{selectedOrder.flight_number || '—'}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Откуда</p>
                    <p className="text-lg">{selectedOrder.from_location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Куда</p>
                    <p className="text-lg">{selectedOrder.to_location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Дата и время подачи</p>
                    <p className="text-lg">{formatDateTime(selectedOrder.pickup_datetime)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Стоимость</p>
                    <p className="text-lg font-bold text-gradient">{selectedOrder.price} ₽</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Тип трансфера</p>
                  <p>{TRANSFER_LABELS[selectedOrder.transfer_type || 'individual']}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Класс авто</p>
                  <p>{CAR_LABELS[selectedOrder.car_class || 'comfort']}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Пассажиров</p>
                  <p>{selectedOrder.passengers_count || 1}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Тип оплаты</p>
                  <p>{PAYMENT_LABELS[selectedOrder.payment_type || 'full']}{selectedOrder.prepay_amount ? ` (предоплата ${selectedOrder.prepay_amount} ₽)` : ''}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Статус</p>
                <Badge style={{ backgroundColor: selectedOrder.status_color }} className="text-white border-0 px-4 py-2 text-base">
                  {selectedOrder.status_name}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersManager;