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
  status: string;
  is_approved: boolean;
  created_at: string;
  driver_name?: string;
  admin_reply?: string;
}

const ReviewsManager = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ author_name: '', rating: 5, text: '', source: 'yandex' });
  const [addOpen, setAddOpen] = useState(false);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.reviews}&action=list`);
      const data = await r.json();
      setReviews(data.reviews || []);
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const moderate = async (id: number, is_approved: boolean) => {
    await fetch(API_URLS.reviews, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'moderate', is_approved })
    });
    toast({ title: is_approved ? 'Отзыв одобрен и опубликован' : 'Отзыв скрыт' });
    loadReviews();
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    await fetch(`${API_URLS.reviews}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Отзыв удалён' });
    loadReviews();
  };

  const addReview = async () => {
    if (!addForm.text) { toast({ title: 'Укажите текст', variant: 'destructive' }); return; }
    await fetch(API_URLS.reviews, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, type: 'service' })
    });
    await fetch(API_URLS.reviews, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'moderate', is_approved: true })
    });
    toast({ title: 'Отзыв добавлен' });
    setAddOpen(false);
    setAddForm({ author_name: '', rating: 5, text: '', source: 'yandex' });
    loadReviews();
  };

  const saveReply = async (id: number) => {
    await fetch(API_URLS.reviews, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reply', reply: replyText })
    });
    toast({ title: 'Ответ сохранён' });
    setReplyId(null);
    setReplyText('');
    loadReviews();
  };

  const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const pending = reviews.filter(r => !r.is_approved && r.status !== 'rejected');
  const approved = reviews.filter(r => r.is_approved);
  const rejected = reviews.filter(r => !r.is_approved && r.status === 'rejected');

  const ReviewCard = ({ r }: { r: Review }) => (
    <div className={`p-4 border rounded-lg ${!r.is_approved && r.status !== 'rejected' ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium">{r.author_name || 'Аноним'}</span>
            <span className="text-yellow-500 text-sm">{stars(r.rating)}</span>
            {r.is_approved
              ? <Badge className="bg-green-500 text-white text-xs">Опубликован</Badge>
              : r.status === 'rejected'
                ? <Badge variant="destructive" className="text-xs">Скрыт</Badge>
                : <Badge variant="secondary" className="text-xs">На модерации</Badge>
            }
            <Badge variant="outline" className="text-xs">
              {r.source === 'yandex' ? 'Яндекс' : r.source === 'site' ? 'Сайт' : r.source}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{r.text}</p>
          {r.driver_name && <p className="text-xs text-muted-foreground mt-1">Водитель: {r.driver_name}</p>}
          {r.admin_reply && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <span className="font-medium">Ответ:</span> {r.admin_reply}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString('ru')}</p>
          {replyId === r.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Ваш ответ на отзыв..."
                rows={2}
                className="text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={() => saveReply(r.id)}>Сохранить</Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyId(null)}>Отмена</Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!r.is_approved && r.status !== 'rejected' && (
            <Button size="sm" className="text-xs bg-green-500 hover:bg-green-600 text-white" onClick={() => moderate(r.id, true)}>
              <Icon name="Check" className="h-3 w-3 mr-1" />Опубликовать
            </Button>
          )}
          {r.is_approved && (
            <Button size="sm" variant="outline" className="text-xs text-orange-500" onClick={() => moderate(r.id, false)}>
              <Icon name="EyeOff" className="h-3 w-3 mr-1" />Скрыть
            </Button>
          )}
          {r.status === 'rejected' && (
            <Button size="sm" variant="outline" className="text-xs text-green-600" onClick={() => moderate(r.id, true)}>
              <Icon name="Eye" className="h-3 w-3 mr-1" />Показать
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs" onClick={() => { setReplyId(r.id); setReplyText(r.admin_reply || ''); }}>
            <Icon name="MessageSquare" className="h-3 w-3 mr-1" />Ответить
          </Button>
          <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => deleteReview(r.id)}>
            <Icon name="Trash2" className="h-3 w-3 mr-1" />Удалить
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Отзывы</CardTitle>
          {pending.length > 0 && (
            <p className="text-sm text-yellow-600 mt-1">{pending.length} отзыва ждут модерации</p>
          )}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить отзыв
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить отзыв вручную</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Источник</Label>
                <select className="w-full border rounded p-2 mt-1 text-sm bg-background"
                  value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="yandex">Яндекс.Карты</option>
                  <option value="google">Google</option>
                  <option value="2gis">2GIS</option>
                  <option value="site">Сайт</option>
                </select>
              </div>
              <div>
                <Label>Имя автора</Label>
                <Input value={addForm.author_name} onChange={e => setAddForm(f => ({ ...f, author_name: e.target.value }))} placeholder="Имя клиента" />
              </div>
              <div>
                <Label>Оценка</Label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setAddForm(f => ({ ...f, rating: n }))}
                      className={`text-2xl transition-transform hover:scale-110 ${n <= addForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Текст отзыва</Label>
                <Textarea value={addForm.text} onChange={e => setAddForm(f => ({ ...f, text: e.target.value }))} rows={4} />
              </div>
              <Button className="w-full gradient-primary text-white" onClick={addReview}>Добавить и опубликовать</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h3 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                  <Icon name="Clock" className="h-4 w-4" />На модерации ({pending.length})
                </h3>
                <div className="space-y-3">{pending.map(r => <ReviewCard key={r.id} r={r} />)}</div>
              </div>
            )}
            {approved.length > 0 && (
              <div>
                <h3 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Icon name="CheckCircle" className="h-4 w-4" />Опубликованы ({approved.length})
                </h3>
                <div className="space-y-3">{approved.map(r => <ReviewCard key={r.id} r={r} />)}</div>
              </div>
            )}
            {rejected.length > 0 && (
              <div>
                <h3 className="font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Icon name="EyeOff" className="h-4 w-4" />Скрытые ({rejected.length})
                </h3>
                <div className="space-y-3">{rejected.map(r => <ReviewCard key={r.id} r={r} />)}</div>
              </div>
            )}
            {reviews.length === 0 && <p className="text-center text-muted-foreground py-8">Отзывов пока нет</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsManager;
