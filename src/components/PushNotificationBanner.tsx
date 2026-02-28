import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const PushNotificationBanner = () => {
  const { state, subscribe, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_dismissed') === '1');
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSupported || state === 'granted' || state === 'denied' || dismissed) return null;
  if (state === 'loading' || state === 'unsupported') return null;

  const handleSubscribe = async () => {
    setSubscribing(true);
    const ok = await subscribe();
    setSubscribing(false);
    if (ok) setSuccess(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('push_dismissed', '1');
    setDismissed(true);
  };

  if (success) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg flex items-center gap-3 animate-fade-in">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Icon name="BellRing" className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Push-уведомления включены!</p>
          <p className="text-xs text-green-600">Вы будете получать статус заказов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm bg-white border border-border rounded-xl p-4 shadow-xl animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Icon name="Bell" className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Включить уведомления?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Получайте статус вашего трансфера прямо на телефон</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="gradient-primary text-white flex-1" onClick={handleSubscribe} disabled={subscribing}>
              {subscribing ? <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin mr-1" /> : <Icon name="Bell" className="h-3.5 w-3.5 mr-1" />}
              Включить
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Нет
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationBanner;
