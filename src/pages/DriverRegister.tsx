import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

const CAR_BRANDS = ['Toyota', 'Mercedes-Benz', 'BMW', 'Kia', 'Hyundai', 'Volkswagen', 'Ford', 'Nissan',
  'Mitsubishi', 'Honda', 'Mazda', 'Lexus', 'Audi', 'Skoda', 'Renault', 'Peugeot', 'Daewoo', 'ВАЗ (Lada)',
  'УАЗ', 'ГАЗ', 'Другая'];

const COLORS = ['Белый', 'Чёрный', 'Серебристый', 'Серый', 'Красный', 'Синий', 'Зелёный', 'Жёлтый', 'Коричневый', 'Другой'];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const DriverRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', password2: '',
    car_brand: '', car_model: '', car_color: '', car_number: '', car_number_country: 'RUS'
  });

  const [files, setFiles] = useState<Record<string, string>>({});
  const [carPhotos, setCarPhotos] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [carPhotoNames, setCarPhotoNames] = useState<string[]>([]);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setFiles(f => ({ ...f, [key]: b64 }));
    setFileNames(f => ({ ...f, [key]: file.name }));
  };

  const handleCarPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 5);
    const b64s = await Promise.all(selectedFiles.map(fileToBase64));
    setCarPhotos(b64s);
    setCarPhotoNames(selectedFiles.map(f => f.name));
  };

  const handleSubmit = async () => {
    if (form.password !== form.password2) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' }); return;
    }
    if (!form.name || !form.phone || !form.password || !form.car_brand || !form.car_model || !form.car_number) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: form.name, phone: form.phone, email: form.email,
          password: form.password,
          car_brand: form.car_brand, car_model: form.car_model,
          car_color: form.car_color, car_number: form.car_number,
          car_number_country: form.car_number_country,
          files, car_photos: carPhotos
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка регистрации');
      toast({ title: 'Заявка отправлена!', description: 'Мы проверим документы и свяжемся с вами.' });
      navigate('/driver/login');
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, field, required }: { label: string; field: string; required?: boolean }) => (
    <div>
      <Label>{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
      <div className="mt-1">
        <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors ${files[field] ? 'border-green-500 bg-green-50' : 'border-muted'}`}>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(field, e)} />
          {files[field] ? (
            <><Icon name="CheckCircle2" className="h-5 w-5 text-green-500" /><span className="text-sm text-green-700 truncate">{fileNames[field]}</span></>
          ) : (
            <><Icon name="Upload" className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Загрузить фото</span></>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Icon name="Car" className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gradient">ПоехалиПро</span>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s <= step ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {s < step ? <Icon name="Check" className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-muted-foreground">
            {step === 1 && 'Личные данные'}
            {step === 2 && 'Автомобиль'}
            {step === 3 && 'Документы'}
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Личные данные</CardTitle>
              <CardDescription>Стать водителем ПоехалиПро</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>ФИО <span className="text-red-500">*</span></Label>
                  <Input placeholder="Иванов Иван Иванович" value={form.name} onChange={e => setField('name', e.target.value)} required />
                </div>
                <div>
                  <Label>Телефон <span className="text-red-500">*</span></Label>
                  <Input placeholder="+7 (900) 000-00-00" value={form.phone} onChange={e => setField('phone', e.target.value)} required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
                </div>
                <div>
                  <Label>Пароль <span className="text-red-500">*</span></Label>
                  <Input type="password" placeholder="Минимум 6 символов" value={form.password} onChange={e => setField('password', e.target.value)} required minLength={6} />
                </div>
                <div>
                  <Label>Подтвердите пароль <span className="text-red-500">*</span></Label>
                  <Input type="password" placeholder="Повторите пароль" value={form.password2} onChange={e => setField('password2', e.target.value)} required />
                </div>
              </div>
              <Button className="w-full gradient-primary text-white" onClick={() => {
                  if (form.password !== form.password2) {
                    toast({ title: 'Пароли не совпадают', variant: 'destructive' }); return;
                  }
                  if (form.password.length < 6) {
                    toast({ title: 'Пароль минимум 6 символов', variant: 'destructive' }); return;
                  }
                  setStep(2);
                }}
                disabled={!form.name || !form.phone || !form.password || !form.password2}>
                Далее
                <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Данные автомобиля</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Марка <span className="text-red-500">*</span></Label>
                  <Select value={form.car_brand} onValueChange={v => setField('car_brand', v)}>
                    <SelectTrigger><SelectValue placeholder="Выберите марку" /></SelectTrigger>
                    <SelectContent>
                      {CAR_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Модель <span className="text-red-500">*</span></Label>
                  <Input placeholder="Camry, E-Class, X5..." value={form.car_model} onChange={e => setField('car_model', e.target.value)} />
                </div>
                <div>
                  <Label>Цвет</Label>
                  <Select value={form.car_color} onValueChange={v => setField('car_color', v)}>
                    <SelectTrigger><SelectValue placeholder="Цвет" /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Страна номера</Label>
                  <Select value={form.car_number_country} onValueChange={v => setField('car_number_country', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUS">🇷🇺 RUS — Россия</SelectItem>
                      <SelectItem value="ABH">🏳 ABH — Абхазия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Гос. номер <span className="text-red-500">*</span></Label>
                  <Input placeholder="А123ВС123" value={form.car_number} onChange={e => setField('car_number', e.target.value.toUpperCase())} />
                </div>
              </div>

              <div>
                <Label>Фотографии автомобиля (до 5 штук)</Label>
                <label className={`mt-1 flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors ${carPhotos.length > 0 ? 'border-green-500 bg-green-50' : 'border-muted'}`}>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleCarPhotos} />
                  {carPhotos.length > 0 ? (
                    <><Icon name="CheckCircle2" className="h-5 w-5 text-green-500" /><span className="text-sm text-green-700">{carPhotos.length} фото выбрано</span></>
                  ) : (
                    <><Icon name="Camera" className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Загрузить фото авто с разных ракурсов</span></>
                  )}
                </label>
                {carPhotoNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {carPhotoNames.map((n, i) => <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>)}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                <Button className="flex-1 gradient-primary text-white" onClick={() => setStep(3)}
                  disabled={!form.car_brand || !form.car_model || !form.car_number}>
                  Далее
                  <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Документы</CardTitle>
              <CardDescription>Загрузите документы для верификации. Фото должны быть чёткими.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <FileUploadField label="Фото паспорта" field="passport_photo" required />
                <FileUploadField label="Водительское удостоверение (лицевая сторона)" field="license_front" required />
                <FileUploadField label="Водительское удостоверение (обратная сторона)" field="license_back" />
                <FileUploadField label="Техпаспорт автомобиля (лицевая сторона)" field="car_tech_passport_front" />
                <FileUploadField label="Техпаспорт автомобиля (обратная сторона)" field="car_tech_passport_back" />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <Icon name="Info" className="h-4 w-4 inline mr-1" />
                После отправки заявки менеджер проверит документы в течение 24 часов и свяжется с вами.
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                <Button className="flex-1 gradient-primary text-white" onClick={handleSubmit} disabled={loading}>
                  {loading ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : <Icon name="Send" className="h-4 w-4 mr-2" />}
                  Отправить заявку
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Уже зарегистрированы?{' '}
          <button className="text-primary hover:underline" onClick={() => navigate('/driver/login')}>
            Войти как водитель
          </button>
        </p>
      </div>
    </div>
  );
};

export default DriverRegister;