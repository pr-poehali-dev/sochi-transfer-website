import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
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

const NewsPage = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetch(API_URLS.news)
      .then(r => r.json())
      .then(d => setNews(d.news || []))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  if (selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <nav className="border-b glass-effect sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Icon name="Car" className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gradient">ПоехалиПро</span>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {selected.image_url && (
            <img src={selected.image_url} alt={selected.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
          )}
          <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
            <Icon name="Calendar" className="h-4 w-4" />
            <span>{formatDate(selected.published_at || selected.created_at)}</span>
          </div>
          <h1 className="text-3xl font-bold mb-6 leading-tight">{selected.title}</h1>
          <div className="prose prose-lg max-w-none">
            {selected.content.split('\n').map((para, i) => (
              para ? <p key={i} className="mb-4 text-muted-foreground leading-relaxed">{para}</p> : <br key={i} />
            ))}
          </div>
          <Button variant="outline" className="mt-8" onClick={() => setSelected(null)}>
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Все новости
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <nav className="border-b glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Icon name="Car" className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gradient">ПоехалиПро</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Новости</h1>
          <p className="text-muted-foreground">Актуальные новости и обновления</p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-xl" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Icon name="Newspaper" className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Новостей пока нет</h3>
            <p className="text-muted-foreground">Следите за обновлениями</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {news.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelected(item)}>
                {item.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon name="Newspaper" className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Icon name="Calendar" className="h-3 w-3" />
                    <span>{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                    <span>Читать далее</span>
                    <Icon name="ArrowRight" className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
