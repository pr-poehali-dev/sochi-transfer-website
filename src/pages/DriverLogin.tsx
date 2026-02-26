import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

const DriverLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone, password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка входа');
      localStorage.setItem('driver_token', data.token);
      localStorage.setItem('driver_id', String(data.driver.id));
      localStorage.setItem('driver_name', data.driver.name);
      localStorage.setItem('driver_status', data.driver.status);
      toast({ title: 'Добро пожаловать!', description: data.driver.name });
      navigate('/driver/cabinet');
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Icon name="Car" className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gradient block">ПоехалиПро</span>
            <span className="text-xs text-muted-foreground">Кабинет водителя</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход для водителей</CardTitle>
            <CardDescription>Введите данные для доступа к личному кабинету</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Телефон</Label>
                <Input placeholder="+7 (900) 000-00-00" value={phone}
                  onChange={e => setPhone(e.target.value)} required />
              </div>
              <div>
                <Label>Пароль</Label>
                <Input type="password" placeholder="Пароль" value={password}
                  onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4 space-y-1">
          <Button variant="link" onClick={() => navigate('/driver/register')}>
            Зарегистрироваться как водитель →
          </Button>
          <div>
            <Button variant="link" className="text-sm text-muted-foreground" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" className="mr-1 h-3 w-3" />
              На главную
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
