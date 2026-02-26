import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const NewsManager = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_published: false, image_base64: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNews(); }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.news}&admin=true`);
      const data = await r.json();
      setNews(data.news || []);
    } catch { toast({ title: 'Ошибка загрузки', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', is_published: false, image_base64: '' });
    setOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, is_published: item.is_published, image_base64: '' });
    setOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image_base64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast({ title: 'Заполните поля', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, title: form.title, content: form.content, is_published: form.is_published, image_base64: form.image_base64, image_url: editing.image_url }
        : { title: form.title, content: form.content, is_published: form.is_published, image_base64: form.image_base64 };
      const r = await fetch(API_URLS.news, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      toast({ title: editing ? 'Новость обновлена' : 'Новость создана' });
      setOpen(false);
      loadNews();
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить новость?')) return;
    await fetch(`${API_URLS.news}&id=${id}`, { method: 'DELETE' });
    toast({ title: 'Новость удалена' });
    loadNews();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Новости</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white" onClick={openCreate}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Редактировать новость' : 'Новая новость'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Заголовок</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок новости" />
              </div>
              <div>
                <Label>Текст</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Текст новости..." />
              </div>
              <div>
                <Label>Изображение</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} id="pub" />
                <Label htmlFor="pub">Опубликовать сразу</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Отмена</Button>
                <Button className="flex-1 gradient-primary text-white" onClick={handleSave} disabled={saving}>
                  {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Icon name="Loader2" className="h-6 w-6 animate-spin text-primary" /></div>
        ) : news.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Новостей пока нет</p>
        ) : (
          <div className="space-y-3">
            {news.map(item => (
              <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{item.title}</p>
                    <Badge variant={item.is_published ? 'default' : 'secondary'} className={item.is_published ? 'bg-green-500 text-white' : ''}>
                      {item.is_published ? 'Опубликована' : 'Черновик'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.content.substring(0, 100)}...</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(item.created_at).toLocaleDateString('ru')}</p>
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsManager;