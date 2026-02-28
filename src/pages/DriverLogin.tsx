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

  const [resetMode, setResetMode] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetLoading, setResetLoading] = useState(false);

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

  const handleResetRequest = async () => {
    if (!resetPhone) { toast({ title: 'Введите телефон', variant: 'destructive' }); return; }
    setResetLoading(true);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_reset', phone: resetPhone })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Код отправлен', description: `Код: ${d.code || '(проверьте SMS)'}` });
      setResetStep(2);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally { setResetLoading(false); }
  };

  const handleResetConfirm = async () => {
    if (!resetCode || !resetNewPwd) { toast({ title: 'Введите код и новый пароль', variant: 'destructive' }); return; }
    setResetLoading(true);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_reset', phone: resetPhone, code: resetCode, new_password: resetNewPwd })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка');
      toast({ title: 'Пароль изменён! Войдите с новым паролем.' });
      setResetMode(false); setResetStep(1); setResetCode(''); setResetNewPwd('');
      setPhone(resetPhone);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally { setResetLoading(false); }
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

        {!resetMode ? (
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
                <div className="text-right">
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setResetMode(true); setResetPhone(phone); }}>
                    Забыли пароль?
                  </button>
                </div>
                <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                  {loading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                  Войти
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Восстановление пароля</CardTitle>
              <CardDescription>{resetStep === 1 ? 'Введите номер телефона' : 'Введите код и новый пароль'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetStep === 1 ? (
                <>
                  <div>
                    <Label>Телефон</Label>
                    <Input placeholder="+7 (900) 000-00-00" value={resetPhone} onChange={e => setResetPhone(e.target.value)} />
                  </div>
                  <Button className="w-full gradient-primary text-white" onClick={handleResetRequest} disabled={resetLoading}>
                    {resetLoading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                    Получить код
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>Код из SMS</Label>
                    <Input placeholder="123456" value={resetCode} onChange={e => setResetCode(e.target.value)} />
                  </div>
                  <div>
                    <Label>Новый пароль</Label>
                    <Input type="password" placeholder="Минимум 6 символов" value={resetNewPwd} onChange={e => setResetNewPwd(e.target.value)} />
                  </div>
                  <Button className="w-full gradient-primary text-white" onClick={handleResetConfirm} disabled={resetLoading}>
                    {resetLoading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                    Сменить пароль
                  </Button>
                </>
              )}
              <Button variant="ghost" className="w-full" onClick={() => { setResetMode(false); setResetStep(1); }}>
                ← Назад к входу
              </Button>
            </CardContent>
          </Card>
        )}

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