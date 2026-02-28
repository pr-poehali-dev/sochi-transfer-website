import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Order {
  id: number;
  from_location: string;
  to_location: string;
  pickup_datetime: string;
  price: number;
  status_name: string;
  status_color: string;
  driver_name?: string;
  driver_phone?: string;
  car_brand?: string;
  car_model?: string;
  car_color?: string;
  car_number?: string;
  driver_rating?: number;
  transfer_type: string;
  car_class: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [reviewDriverId, setReviewDriverId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRequisites, setWithdrawRequisites] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);

  const { state: pushState, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, isSupported: pushSupported } = usePushNotifications();
  const [pushLoading, setPushLoading] = useState(false);

  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name') || 'Пользователь';

  useEffect(() => {
    if (!userId) { navigate('/auth'); return; }
    loadOrders();
    loadBalance();
  }, [userId]);

  const loadOrders = async () => {
    try {
      const r = await fetch(`${API_URLS.users}&action=orders&user_id=${userId}`);
      const data = await r.json();
      setOrders(data.orders || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить заказы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const r = await fetch(`${API_URLS.users}&action=profile&user_id=${userId}`);
      const data = await r.json();
      setBalance(Number(data.user?.balance || 0));
    } catch (e) { console.error(e); }
    try {
      const r2 = await fetch(`${API_URLS.balance}&action=transactions&user_id=${userId}`);
      const data2 = await r2.json();
      setTransactions(data2.transactions || []);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    navigate('/');
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      await fetch(API_URLS.reviews, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(userId),
          driver_id: reviewDriverId,
          order_id: reviewOrderId,
          author_name: userName,
          rating: reviewRating,
          text: reviewText,
          type: 'driver',
        })
      });
      toast({ title: 'Отзыв отправлен', description: 'Отзыв проходит модерацию' });
      setReviewOrderId(null);
      setReviewText('');
      setReviewRating(5);
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawRequisites) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: parseFloat(withdrawAmount), requisites: withdrawRequisites, user_id: userId })
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на вывод создана', description: 'Ожидайте подтверждения администратора' });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawRequisites('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const submitDeposit = async () => {
    if (!depositAmount) { toast({ title: 'Укажите сумму', variant: 'destructive' }); return; }
    try {
      const r = await fetch(API_URLS.balance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', amount: parseFloat(depositAmount), payment_method: depositMethod, user_id: userId })
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({ title: 'Заявка на пополнение создана', description: 'Ожидайте подтверждения администратора' });
      setDepositOpen(false);
      setDepositAmount('');
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
  };

  const getStatusBg = (color: string) => {
    const map: Record<string, string> = {
      '#10B981': 'bg-green-100 text-green-800',
      '#F59E0B': 'bg-yellow-100 text-yellow-800',
      '#EF4444': 'bg-red-100 text-red-800',
      '#8B5CF6': 'bg-purple-100 text-purple-800',
      '#F97316': 'bg-orange-100 text-orange-800',
      '#6B7280': 'bg-gray-100 text-gray-800',
    };
    return map[color] || 'bg-blue-100 text-blue-800';
  };

  const carClassLabel = (c: string) => ({ individual: 'Индивидуальный', group: 'Групповой' }[c] || c);
  const carClass2 = (c: string) => ({ economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', minivan: 'Минивэн' }[c] || c);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gradient">ПоехалиПро</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Личный кабинет</h1>
          <p className="text-muted-foreground">{userName}</p>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="orders">Мои заказы</TabsTrigger>
            <TabsTrigger value="balance">Баланс</TabsTrigger>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? (
              <div className="flex justify-center py-16">
                <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Icon name="PackageSearch" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">У вас ещё нет заказов</p>
                  <Button className="gradient-primary text-white" onClick={() => navigate('/')}>Заказать трансфер</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">Заказ #{order.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBg(order.status_color)}`}>
                              {order.status_name}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {new Date(order.pickup_datetime).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gradient">{order.price} ₽</div>
                          <div className="text-xs text-muted-foreground">{carClassLabel(order.transfer_type)} · {carClass2(order.car_class)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Icon name="MapPin" className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{order.from_location}</span>
                        <Icon name="ArrowRight" className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{order.to_location}</span>
                      </div>

                      {order.driver_name && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-xs text-muted-foreground mb-2">Водитель назначен:</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{order.driver_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.car_brand} {order.car_model} · {order.car_color} · {order.car_number}
                              </p>
                            </div>
                            {order.driver_rating && order.driver_rating > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Icon name="Star" className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                {Number(order.driver_rating).toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          {order.driver_phone && (
                            <a href={`tel:${order.driver_phone}`} className="text-primary text-sm mt-2 flex items-center gap-1">
                              <Icon name="Phone" className="h-3 w-3" />
                              {order.driver_phone}
                            </a>
                          )}
                        </div>
                      )}

                      {order.driver_name && order.status_name === 'Выполнен' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full"
                              onClick={() => { setReviewOrderId(order.id); setReviewDriverId(null); }}>
                              <Icon name="Star" className="mr-2 h-4 w-4" />
                              Оставить отзыв о водителе
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Отзыв о водителе — {order.driver_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Оценка</Label>
                                <div className="flex gap-2 mt-2">
                                  {[1,2,3,4,5].map(n => (
                                    <button key={n} onClick={() => setReviewRating(n)}
                                      className={`text-2xl transition-transform hover:scale-110 ${n <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label>Комментарий</Label>
                                <Textarea placeholder="Расскажите о поездке..." value={reviewText}
                                  onChange={e => setReviewText(e.target.value)} />
                              </div>
                              <Button className="w-full gradient-primary text-white"
                                onClick={submitReview} disabled={reviewSubmitting}>
                                {reviewSubmitting ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                                Отправить отзыв
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="balance">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Баланс счёта</p>
                      <p className="text-4xl font-bold text-gradient">{balance.toFixed(2)} ₽</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                      <Icon name="Wallet" className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 gradient-primary text-white">
                          <Icon name="Plus" className="mr-2 h-4 w-4" />Пополнить
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Пополнение баланса</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Сумма (₽)</Label>
                            <Input type="number" placeholder="1000" value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)} />
                          </div>
                          <div>
                            <Label>Способ оплаты</Label>
                            <select className="w-full border rounded p-2 mt-1 text-sm bg-background"
                              value={depositMethod} onChange={e => setDepositMethod(e.target.value)}>
                              <option value="">Выберите способ</option>
                              <option value="card">Банковская карта</option>
                              <option value="sbp">СБП</option>
                              <option value="cash">Наличные</option>
                            </select>
                          </div>
                          <p className="text-xs text-muted-foreground">Администратор свяжется с вами для подтверждения платежа.</p>
                          <Button className="w-full gradient-primary text-white" onClick={submitDeposit}>Отправить заявку</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1" variant="outline">
                          <Icon name="ArrowUpRight" className="mr-2 h-4 w-4" />Вывести
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Вывод средств</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">Доступно: <strong>{balance.toFixed(2)} ₽</strong></p>
                          <div>
                            <Label>Сумма (₽)</Label>
                            <Input type="number" placeholder="1000" value={withdrawAmount}
                              onChange={e => setWithdrawAmount(e.target.value)} />
                          </div>
                          <div>
                            <Label>Реквизиты (номер карты / телефон СБП)</Label>
                            <Textarea placeholder="Номер карты или СБП..." value={withdrawRequisites}
                              onChange={e => setWithdrawRequisites(e.target.value)} rows={3} />
                          </div>
                          <Button className="w-full gradient-primary text-white" onClick={submitWithdraw}>Вывести</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>История операций</CardTitle></CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">Операций пока нет</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{t.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('ru')}</p>
                          </div>
                          <div className={`font-semibold ${Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(t.amount) >= 0 ? '+' : ''}{Number(t.amount).toFixed(2)} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Мои данные</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{userName}</p>
                    <p className="text-sm text-muted-foreground">Пассажир</p>
                  </div>
                </div>
                {pushSupported && pushState !== 'unsupported' && (
                  <div className="p-4 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="Bell" className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Push-уведомления</p>
                          <p className="text-xs text-muted-foreground">Статус заказов на телефон</p>
                        </div>
                      </div>
                      <Badge variant={pushState === 'granted' ? 'default' : pushState === 'denied' ? 'destructive' : 'outline'} className="text-xs">
                        {pushState === 'granted' ? 'Включены' : pushState === 'denied' ? 'Заблокированы' : 'Выключены'}
                      </Badge>
                    </div>
                    {pushState === 'granted' ? (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={async () => { setPushLoading(true); await pushUnsubscribe(); setPushLoading(false); }} disabled={pushLoading}>
                        {pushLoading ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1" /> : <Icon name="BellOff" className="h-3 w-3 mr-1" />}
                        Отключить уведомления
                      </Button>
                    ) : pushState === 'denied' ? (
                      <p className="text-xs text-muted-foreground">Разрешите уведомления в настройках браузера</p>
                    ) : (
                      <Button size="sm" className="w-full gradient-primary text-white text-xs" onClick={async () => { setPushLoading(true); await pushSubscribe(); setPushLoading(false); }} disabled={pushLoading}>
                        {pushLoading ? <Icon name="Loader2" className="h-3 w-3 animate-spin mr-1" /> : <Icon name="Bell" className="h-3 w-3 mr-1" />}
                        Включить уведомления
                      </Button>
                    )}
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  <Icon name="Home" className="mr-2 h-4 w-4" />На главную
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/driver/register')}>
                  <Icon name="Car" className="mr-2 h-4 w-4" />Стать водителем
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <Icon name="LogOut" className="mr-2 h-4 w-4" />Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;