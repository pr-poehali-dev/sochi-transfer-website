import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  type: string;
  source: string;
  yandex_url: string | null;
  status: string;
  is_approved: boolean;
  created_at: string;
  driver_name?: string;
}

const ReviewsManager = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [yandexForm, setYandexForm] = useState({ author_name: '', rating: 5, text: '', yandex_url: '' });
  const [yandexOpen, setYandexOpen] = useState(false);

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.reviews}&admin=true`);
      const data = await r.json();
      setReviews(data.reviews || []);
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    await fetch(API_URLS.reviews, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    toast({ title: action === 'approve' ? 'Отзыв одобрен' : 'Отзыв отклонён' });
    loadReviews();
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    await fetch(`${API_URLS.reviews}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Отзыв удалён' });
    loadReviews();
  };

  const addYandex = async () => {
    await fetch(API_URLS.reviews, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_yandex', ...yandexForm })
    });
    toast({ title: 'Отзыв с Яндекса добавлен' });
    setYandexOpen(false);
    setYandexForm({ author_name: '', rating: 5, text: '', yandex_url: '' });
    loadReviews();
  };

  const statusBadge = (r: Review) => {
    if (r.is_approved) return <Badge className="bg-green-500 text-white text-xs">Одобрен</Badge>;
    if (r.status === 'rejected') return <Badge variant="destructive" className="text-xs">Отклонён</Badge>;
    return <Badge variant="secondary" className="text-xs">На модерации</Badge>;
  };

  const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Отзывы</CardTitle>
        <div className="flex gap-2">
          <Dialog open={yandexOpen} onOpenChange={setYandexOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon name="Star" className="mr-2 h-4 w-4 text-yellow-500" />
                Добавить с Яндекс
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить отзыв с Яндекс.Карт</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Имя автора</Label>
                  <Input value={yandexForm.author_name} onChange={e => setYandexForm(f => ({ ...f, author_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Оценка</Label>
                  <div className="flex gap-2 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setYandexForm(f => ({ ...f, rating: n }))}
                        className={`text-2xl transition-transform hover:scale-110 ${n <= yandexForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Текст отзыва</Label>
                  <Textarea value={yandexForm.text} onChange={e => setYandexForm(f => ({ ...f, text: e.target.value }))} rows={4} />
                </div>
                <div>
                  <Label>Ссылка на Яндекс (необязательно)</Label>
                  <Input value={yandexForm.yandex_url} onChange={e => setYandexForm(f => ({ ...f, yandex_url: e.target.value }))} placeholder="https://yandex.ru/maps/..." />
                </div>
                <Button className="w-full gradient-primary text-white" onClick={addYandex}>Добавить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Отзывов пока нет</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className={`p-4 border rounded-lg ${!r.is_approved && r.status !== 'rejected' ? 'border-yellow-300 bg-yellow-50/50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">{r.author_name}</span>
                      <span className="text-yellow-500 text-sm">{stars(r.rating)}</span>
                      {statusBadge(r)}
                      <Badge variant="outline" className="text-xs">{r.source === 'yandex' ? 'Яндекс' : 'Сайт'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                    {r.driver_name && <p className="text-xs text-muted-foreground mt-1">Водитель: {r.driver_name}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString('ru')}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!r.is_approved && r.status !== 'rejected' && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => moderate(r.id, 'approve')}>
                          <Icon name="Check" className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-300" onClick={() => moderate(r.id, 'reject')}>
                          <Icon name="X" className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {r.is_approved && (
                      <Button size="sm" variant="outline" className="text-orange-500" onClick={() => moderate(r.id, 'reject')}>
                        <Icon name="EyeOff" className="h-4 w-4" />
                      </Button>
                    )}
                    {r.status === 'rejected' && (
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => moderate(r.id, 'approve')}>
                        <Icon name="Eye" className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteReview(r.id)}>
                      <Icon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsManager;
