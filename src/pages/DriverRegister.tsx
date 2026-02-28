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

// ─── Static data ──────────────────────────────────────────────────────────────

const CAR_BRANDS = [
  'Toyota', 'Mercedes-Benz', 'BMW', 'Kia', 'Hyundai', 'Volkswagen', 'Ford',
  'Nissan', 'Mitsubishi', 'Honda', 'Mazda', 'Lexus', 'Audi', 'Skoda',
  'Renault', 'Peugeot', 'Daewoo', 'ВАЗ (Lada)', 'УАЗ', 'ГАЗ', 'Другая',
];

const COLORS = [
  'Белый', 'Чёрный', 'Серебристый', 'Серый', 'Красный',
  'Синий', 'Зелёный', 'Жёлтый', 'Коричневый', 'Другой',
];

// Document slots for step 3
const DOC_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'passport_photo',          label: 'Паспорт',                               hint: 'Страница с фото' },
  { key: 'license_front',           label: 'Водительское удостоверение (лицевая)',   hint: '' },
  { key: 'license_back',            label: 'Водительское удостоверение (обратная)',  hint: '' },
  { key: 'car_tech_passport_front', label: 'СТС (лицевая сторона)',                 hint: '' },
  { key: 'car_tech_passport_back',  label: 'СТС (обратная сторона)',                hint: '' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

const FieldWrap = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}{req && <Req />}</Label>
    {children}
  </div>
);

// ─── Step progress indicator ──────────────────────────────────────────────────

const STEP_LABELS = ['Личные данные', 'Автомобиль', 'Документы'];

const StepBar = ({ step }: { step: number }) => (
  <div className="flex items-center gap-0 mb-6">
    {[1, 2, 3].map((s, i) => (
      <div key={s} className="flex items-center flex-1 last:flex-none">
        {/* Circle */}
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
              s < step
                ? 'gradient-primary text-white'
                : s === step
                ? 'bg-primary text-white ring-4 ring-primary/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s < step ? <Icon name="Check" className="h-4 w-4" /> : s}
          </div>
          <span
            className={`text-[10px] mt-1 whitespace-nowrap font-medium ${
              s === step ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {STEP_LABELS[i]}
          </span>
        </div>
        {/* Connector */}
        {s < 3 && (
          <div
            className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${
              s < step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

// ─── Document upload field ────────────────────────────────────────────────────

const DocField = ({
  label,
  hint,
  preview,
  fileName,
  onChange,
}: {
  label: string;
  hint?: string;
  preview: string | null;
  fileName: string | null;
  onChange: (file: File) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onChange(f);
  };

  return (
    <label className="block cursor-pointer group">
      <div
        className={`relative border-2 border-dashed rounded-xl transition-colors overflow-hidden ${
          preview
            ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-border hover:border-primary/50 bg-muted/20'
        }`}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {preview ? (
          /* Thumbnail with overlay */
          <div className="flex items-center gap-3 p-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-green-300 dark:border-green-700">
              <img src={preview} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="CheckCircle2" className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Загружено</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              <p className="text-xs text-primary mt-0.5">Нажать для замены</p>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex items-center gap-3 p-3 min-h-[64px]">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon name="Upload" className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{label}</p>
              {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
              <p className="text-xs text-muted-foreground">JPG, PNG или PDF</p>
            </div>
          </div>
        )}
      </div>
    </label>
  );
};

// ─── Success screen ───────────────────────────────────────────────────────────

const SuccessScreen = ({ name, onLogin }: { name: string; onLogin: () => void }) => (
  <div className="text-center py-4">
    {/* Icon */}
    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-5">
      <Icon name="CheckCircle2" className="h-10 w-10 text-green-500" />
    </div>

    <h2 className="text-2xl font-bold mb-2">Заявка отправлена!</h2>
    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
      {name}, ваша заявка принята. Менеджер проверит данные и свяжется с вами в течение 24 часов.
    </p>

    {/* Next steps */}
    <div className="bg-muted/40 rounded-2xl p-4 text-left mb-6 max-w-sm mx-auto space-y-3">
      <p className="text-sm font-semibold mb-1">Что дальше?</p>
      {[
        { icon: 'FileText', text: 'Пришлите документы менеджеру в Telegram или WhatsApp' },
        { icon: 'Clock',    text: 'Ожидайте проверку — до 24 часов в рабочие дни' },
        { icon: 'Rocket',   text: 'После активации вы сможете принимать заказы' },
      ].map(item => (
        <div key={item.text} className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-snug">{item.text}</p>
        </div>
      ))}
    </div>

    {/* If documents were skipped, show send-docs prompt */}
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left mb-6 max-w-sm mx-auto">
      <div className="flex items-start gap-2.5">
        <Icon name="MessageCircle" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Отправьте документы менеджеру
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Паспорт, водительское удостоверение и СТС автомобиля можно отправить фото напрямую в мессенджер.
          </p>
        </div>
      </div>
    </div>

    <Button
      className="gradient-primary text-white min-h-[48px] px-8 w-full max-w-sm"
      onClick={onLogin}
    >
      <Icon name="LogIn" className="mr-2 h-4 w-4" />
      Войти в кабинет водителя
    </Button>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const DriverRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password2: '',
    car_brand: '',
    car_model: '',
    car_color: '',
    car_number: '',
    car_number_country: 'RUS',
  });

  // Document files — stored as { preview (dataURL), name, file }
  const [docFiles, setDocFiles] = useState<
    Record<string, { preview: string; name: string; file: File } | null>
  >({});

  // Car photos
  const [carPhotoPreviews, setCarPhotoPreviews] = useState<string[]>([]);
  const [carPhotoFiles, setCarPhotoFiles] = useState<File[]>([]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDocFile = async (key: string, file: File) => {
    try {
      const preview = await fileToDataUrl(file);
      setDocFiles(prev => ({ ...prev, [key]: { preview, name: file.name, file } }));
    } catch (e) {
      console.error('[DriverRegister] handleDocFile error:', e);
      toast({ title: 'Ошибка чтения файла', variant: 'destructive' });
    }
  };

  const handleCarPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 5);
    if (!selected.length) return;
    try {
      const previews = await Promise.all(selected.map(fileToDataUrl));
      setCarPhotoPreviews(previews);
      setCarPhotoFiles(selected);
    } catch (e) {
      console.error('[DriverRegister] handleCarPhotos error:', e);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────────

  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return 'Введите ФИО';
    if (!form.phone.trim()) return 'Введите телефон';
    if (form.password.length < 6) return 'Пароль минимум 6 символов';
    if (form.password !== form.password2) return 'Пароли не совпадают';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.car_brand) return 'Выберите марку автомобиля';
    if (!form.car_model.trim()) return 'Введите модель автомобиля';
    if (!form.car_number.trim()) return 'Введите гос. номер';
    return null;
  };

  const goToStep2 = () => {
    const err = validateStep1();
    if (err) { toast({ title: err, variant: 'destructive' }); return; }
    setStep(2);
  };

  const goToStep3 = () => {
    const err = validateStep2();
    if (err) { toast({ title: err, variant: 'destructive' }); return; }
    setStep(3);
  };

  // ── Submit (documents are optional) ──────────────────────────────────────────

  const handleSubmit = async () => {
    const err1 = validateStep1();
    const err2 = validateStep2();
    if (err1 || err2) {
      toast({ title: err1 ?? err2 ?? 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Build payload WITHOUT base64 blobs to keep payload small
      // Files field stays empty — backend handles file uploads separately
      const payload: Record<string, unknown> = {
        action: 'register',
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        car_brand: form.car_brand,
        car_model: form.car_model.trim(),
        car_color: form.car_color,
        car_number: form.car_number.trim().toUpperCase(),
        car_number_country: form.car_number_country,
        files: {},
        car_photos: [],
      };

      const r = await fetch(API_URLS.drivers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка регистрации');

      setRegistered(true);
    } catch (err: unknown) {
      console.error('[DriverRegister] handleSubmit error:', err);
      toast({
        title: 'Ошибка регистрации',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">

      {/* ── Sticky mini-header ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Car" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">ПоехалиПро</span>
          </button>
          {!registered && (
            <button
              className="text-sm text-muted-foreground hover:text-foreground min-h-[44px] px-2 transition-colors"
              onClick={() => navigate('/driver/login')}
            >
              Уже есть аккаунт
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-10">

        {/* ── Success screen ── */}
        {registered ? (
          <SuccessScreen
            name={form.name.split(' ')[0] || 'Водитель'}
            onLogin={() => navigate('/driver/login')}
          />
        ) : (
          <>
            {/* Page title */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold">Стать водителем</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Заполните анкету — займёт 3–5 минут
              </p>
            </div>

            {/* Step progress bar */}
            <StepBar step={step} />

            {/* ══════════════════════════════════════
                STEP 1 — Personal info
            ══════════════════════════════════════ */}
            {step === 1 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Личные данные</CardTitle>
                  <CardDescription>ФИО, телефон и пароль для входа</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FieldWrap label="ФИО" req>
                    <Input
                      placeholder="Иванов Иван Иванович"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      autoComplete="name"
                      className="h-11"
                      required
                    />
                  </FieldWrap>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Телефон" req>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="+7 (900) 000-00-00"
                        value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                        autoComplete="tel"
                        className="h-11"
                        required
                      />
                    </FieldWrap>

                    <FieldWrap label="Email">
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="email@example.com"
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        autoComplete="email"
                        className="h-11"
                      />
                    </FieldWrap>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Пароль" req>
                      <Input
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={form.password}
                        onChange={e => setField('password', e.target.value)}
                        autoComplete="new-password"
                        className="h-11"
                        minLength={6}
                        required
                      />
                    </FieldWrap>

                    <FieldWrap label="Подтвердите пароль" req>
                      <Input
                        type="password"
                        placeholder="Повторите пароль"
                        value={form.password2}
                        onChange={e => setField('password2', e.target.value)}
                        autoComplete="new-password"
                        className={`h-11 ${
                          form.password2 && form.password !== form.password2
                            ? 'border-red-400 focus-visible:ring-red-400'
                            : ''
                        }`}
                        required
                      />
                      {form.password2 && form.password !== form.password2 && (
                        <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
                      )}
                    </FieldWrap>
                  </div>

                  <Button
                    className="w-full gradient-primary text-white min-h-[48px] text-base font-semibold"
                    onClick={goToStep2}
                    disabled={!form.name || !form.phone || !form.password || !form.password2}
                  >
                    Далее
                    <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ══════════════════════════════════════
                STEP 2 — Car info
            ══════════════════════════════════════ */}
            {step === 2 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Данные автомобиля</CardTitle>
                  <CardDescription>Укажите информацию о вашем автомобиле</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldWrap label="Марка" req>
                      <Select value={form.car_brand} onValueChange={v => setField('car_brand', v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Выберите марку" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAR_BRANDS.map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrap>

                    <FieldWrap label="Модель" req>
                      <Input
                        placeholder="Camry, E-Class, X5..."
                        value={form.car_model}
                        onChange={e => setField('car_model', e.target.value)}
                        autoComplete="off"
                        className="h-11"
                      />
                    </FieldWrap>

                    <FieldWrap label="Цвет">
                      <Select value={form.car_color} onValueChange={v => setField('car_color', v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Цвет кузова" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrap>

                    <FieldWrap label="Страна номера">
                      <Select
                        value={form.car_number_country}
                        onValueChange={v => setField('car_number_country', v)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RUS">🇷🇺 RUS — Россия</SelectItem>
                          <SelectItem value="ABH">🏳 ABH — Абхазия</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWrap>
                  </div>

                  <FieldWrap label="Государственный номер" req>
                    <Input
                      placeholder="А123ВС123"
                      value={form.car_number}
                      onChange={e => setField('car_number', e.target.value.toUpperCase())}
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="h-11 font-mono tracking-wider"
                    />
                  </FieldWrap>

                  {/* Car photo upload (optional, no base64 sent) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Фото автомобиля
                      <span className="text-muted-foreground font-normal ml-1.5 text-xs">(необязательно, до 5 штук)</span>
                    </Label>
                    <label className="block cursor-pointer group">
                      <div
                        className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
                          carPhotoPreviews.length > 0
                            ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/20'
                            : 'border-border hover:border-primary/50 bg-muted/20'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleCarPhotos}
                        />
                        {carPhotoPreviews.length > 0 ? (
                          <div>
                            <div className="flex gap-2 flex-wrap mb-2">
                              {carPhotoPreviews.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`Фото ${i + 1}`}
                                  className="w-14 h-14 rounded-lg object-cover border border-green-300 dark:border-green-700"
                                />
                              ))}
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {carPhotoPreviews.length} фото выбрано · нажать для замены
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Icon name="Camera" className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Загрузить фото авто</p>
                              <p className="text-xs text-muted-foreground">Спереди, сзади, сбоку и салон</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                    {carPhotoFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {carPhotoFiles.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs max-w-[140px] truncate">
                            {f.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[48px]"
                      onClick={() => setStep(1)}
                    >
                      <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                      Назад
                    </Button>
                    <Button
                      className="flex-2 gradient-primary text-white min-h-[48px] font-semibold px-6"
                      onClick={goToStep3}
                      disabled={!form.car_brand || !form.car_model || !form.car_number}
                    >
                      Далее
                      <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ══════════════════════════════════════
                STEP 3 — Documents (OPTIONAL)
            ══════════════════════════════════════ */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Документы
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        необязательно
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Загрузите сейчас или отправьте менеджеру позже в Telegram / WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DOC_FIELDS.map(field => (
                      <DocField
                        key={field.key}
                        label={field.label}
                        hint={field.hint}
                        preview={docFiles[field.key]?.preview ?? null}
                        fileName={docFiles[field.key]?.name ?? null}
                        onChange={file => handleDocFile(field.key, file)}
                      />
                    ))}
                  </CardContent>
                </Card>

                {/* Info banner */}
                <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                  <Icon name="Info" className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-700 dark:text-blue-400 leading-snug">
                    Менеджер свяжется с вами для проверки. Документы также можно отправить фото в мессенджере.
                  </p>
                </div>

                {/* Primary action: SKIP and register */}
                <Button
                  className="w-full gradient-primary text-white min-h-[52px] text-base font-semibold"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <><Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />Регистрация...</>
                  ) : (
                    <><Icon name="Send" className="mr-2 h-5 w-5" />
                      {Object.values(docFiles).some(Boolean)
                        ? 'Зарегистрироваться'
                        : 'Пропустить и зарегистрироваться'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Назад
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Нажимая «Зарегистрироваться», вы соглашаетесь с условиями работы на платформе
                </p>
              </div>
            )}

            {/* Bottom login link */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              Уже зарегистрированы?{' '}
              <button
                className="text-primary hover:underline underline-offset-2 font-medium"
                onClick={() => navigate('/driver/login')}
              >
                Войти как водитель
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default DriverRegister;
