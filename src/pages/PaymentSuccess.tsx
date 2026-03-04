import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

interface OrderInfo {
  id: number;
  from_location: string;
  to_location: string;
  pickup_datetime: string;
  price: number;
  status_name: string;
  status_color: string;
  passenger_name: string;
  transfer_type: string;
  car_class: string;
  paid_at: string | null;
}

const CAR_CLASS_LABELS: Record<string, string> = {
  economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн'
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const loadOrder = async () => {
      try {
        const res = await fetch(`${API_URLS.orders}?id=${orderId}`);
        const data = await res.json();
        const o = data.orders;
        if (o) setOrder(o);
      } catch { /* ignore */ }
      setLoading(false);
    };
    loadOrder();
    const poll = setInterval(loadOrder, 5000);
    setTimeout(() => clearInterval(poll), 60000);
    return () => clearInterval(poll);
  }, [orderId]);

  const formatDate = (dt: string) => {
    try {
      const d = new Date(dt);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dt; }
  };

  const isPaid = order?.paid_at || order?.status_name === 'Подтверждена';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center space-y-4">
          {loading ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Icon name="Loader2" className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : isPaid ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
              <Icon name="CheckCircle" className="h-12 w-12 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <Icon name="Clock" className="h-12 w-12 text-amber-600" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">
              {loading ? `Проверяем оплату${dots}` : isPaid ? 'Оплата прошла успешно!' : 'Ожидаем подтверждение оплаты'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {loading
                ? 'Пожалуйста, подождите'
                : isPaid
                  ? 'Спасибо за заказ! Менеджер свяжется с вами для подтверждения трансфера.'
                  : 'Платёж обрабатывается, это может занять пару минут.'}
            </p>
          </div>
        </div>

        {order && (
          <Card className="border-2 overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: isPaid ? '#10B981' : '#F59E0B' }} />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Заказ #{order.id}</span>
                <Badge style={{ backgroundColor: order.status_color || (isPaid ? '#10B981' : '#8B5CF6'), color: '#fff' }}>
                  {order.status_name}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div className="w-px h-6 bg-border mx-auto" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Откуда</p>
                      <p className="font-medium text-sm">{order.from_location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Куда</p>
                      <p className="font-medium text-sm">{order.to_location}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Дата и время</p>
                    <p className="font-medium text-sm">{formatDate(order.pickup_datetime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Класс авто</p>
                    <p className="font-medium text-sm">{CAR_CLASS_LABELS[order.car_class] || order.car_class}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Итого</span>
                  <span className="text-xl font-bold">{Number(order.price).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !order && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6 text-center">
              <Icon name="FileSearch" className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Информация о заказе не найдена</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/profile')} className="flex-1 gradient-primary text-white h-12">
            <Icon name="User" className="mr-2 h-4 w-4" />
            Мои заказы
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="flex-1 h-12">
            <Icon name="Home" className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </div>

        {isPaid && (
          <p className="text-center text-xs text-muted-foreground">
            Подтверждение отправлено на вашу почту. Водитель свяжется с вами перед поездкой.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;