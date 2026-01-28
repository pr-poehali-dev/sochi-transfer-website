import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';
import Icon from '@/components/ui/icon';

interface Tariff {
  id: number;
  city: string;
  price: number;
}

const BookingForm = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    from_location: 'Аэропорт Сочи',
    to_location: '',
    pickup_datetime: '',
    flight_number: '',
    passenger_name: '',
    passenger_phone: '',
    passenger_email: '',
    tariff_id: '',
    price: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const response = await fetch(`${API_URLS.tariffs}?active=true`);
      const data = await response.json();
      setTariffs(data.tariffs || []);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const handleTariffChange = (tariffId: string) => {
    const tariff = tariffs.find(t => t.id.toString() === tariffId);
    if (tariff) {
      setFormData({
        ...formData,
        tariff_id: tariffId,
        to_location: tariff.city,
        price: tariff.price
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_URLS.orders, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tariff_id: parseInt(formData.tariff_id),
          status_id: 1
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccessDialogOpen(true);
        setFormData({
          from_location: 'Аэропорт Сочи',
          to_location: '',
          pickup_datetime: '',
          flight_number: '',
          passenger_name: '',
          passenger_phone: '',
          passenger_email: '',
          tariff_id: '',
          price: 0
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось создать заявку',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось отправить заявку',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto glass-effect border-white/40 shadow-2xl animate-scale-in">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Откуда</Label>
                <Input 
                  value={formData.from_location} 
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  className="bg-white/50" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Куда</Label>
                <Select value={formData.tariff_id} onValueChange={handleTariffChange} required>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs.map(tariff => (
                      <SelectItem key={tariff.id} value={tariff.id.toString()}>
                        {tariff.city} — {tariff.price} ₽
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата и время подачи</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.pickup_datetime}
                  onChange={(e) => setFormData({ ...formData, pickup_datetime: e.target.value })}
                  className="bg-white/50" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Номер рейса (опционально)</Label>
                <Input 
                  placeholder="SU 1234" 
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  className="bg-white/50" 
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold mb-4">Контактные данные</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>ФИО пассажира</Label>
                  <Input 
                    placeholder="Иванов Иван Иванович" 
                    value={formData.passenger_name}
                    onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                    className="bg-white/50" 
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input 
                      type="tel" 
                      placeholder="+7 (999) 123-45-67" 
                      value={formData.passenger_phone}
                      onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                      className="bg-white/50" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="email@example.com" 
                      value={formData.passenger_email}
                      onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                      className="bg-white/50" 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {formData.price > 0 && (
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Стоимость трансфера</p>
                <p className="text-3xl font-bold text-gradient">{formData.price} ₽</p>
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full gradient-primary text-white font-semibold text-lg h-14 hover:scale-105 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" className="mr-2 h-5 w-5" />
                  Отправить заявку
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="CheckCircle2" className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Заявка принята!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Мы получили вашу заявку и свяжемся с вами в ближайшее время для подтверждения деталей.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="https://wa.me/79123456789" target="_blank" rel="noopener noreferrer">
                <Button className="gradient-primary text-white">
                  <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
              <Button variant="outline" onClick={() => setIsSuccessDialogOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;
