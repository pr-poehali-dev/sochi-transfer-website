import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ phone: '', name: '', email: '', password: '', password2: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка входа');
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_id', String(data.user.id));
      localStorage.setItem('user_name', data.user.name);
      toast({ title: 'Добро пожаловать!', description: data.user.name });
      navigate('/profile');
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.password2) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', phone: regForm.phone, name: regForm.name, email: regForm.email, password: regForm.password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка регистрации');
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_id', String(data.user.id));
      localStorage.setItem('user_name', data.user.name);
      toast({ title: 'Аккаунт создан!', description: 'Добро пожаловать!' });
      navigate('/profile');
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Icon name="Car" className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gradient block">ПоехалиПро</span>
            <span className="text-xs text-muted-foreground">Трансфер Абхазия-Россия</span>
          </div>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Войти</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Вход в аккаунт</CardTitle>
                <CardDescription>Введите телефон и пароль</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Телефон</Label>
                    <Input placeholder="+7 (900) 000-00-00" value={loginForm.phone}
                      onChange={e => setLoginForm(f => ({ ...f, phone: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Пароль</Label>
                    <Input type="password" placeholder="Пароль" value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                    {loading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                    Войти
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Создать аккаунт</CardTitle>
                <CardDescription>Регистрация для пассажиров</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label>Имя и фамилия</Label>
                    <Input placeholder="Иван Иванов" value={regForm.name}
                      onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Телефон</Label>
                    <Input placeholder="+7 (900) 000-00-00" value={regForm.phone}
                      onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Email (необязательно)</Label>
                    <Input type="email" placeholder="email@example.com" value={regForm.email}
                      onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Пароль</Label>
                    <Input type="password" placeholder="Минимум 6 символов" value={regForm.password}
                      onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                  </div>
                  <div>
                    <Label>Подтвердите пароль</Label>
                    <Input type="password" placeholder="Повторите пароль" value={regForm.password2}
                      onChange={e => setRegForm(f => ({ ...f, password2: e.target.value }))} required />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                    {loading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                    Зарегистрироваться
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-4 space-y-2">
          <Button variant="link" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            На главную
          </Button>
          <div>
            <Button variant="link" className="text-sm" onClick={() => navigate('/driver/register')}>
              Хочу стать водителем →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
