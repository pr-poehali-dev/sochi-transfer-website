import { useState, useEffect, useCallback } from 'react';
import { API_URLS } from '@/config/api';

// VAPID public key — для базовой Web Push интеграции (без VAPID используем simple push)
const VAPID_PUBLIC_KEY = '';

export type PushState = 'unsupported' | 'denied' | 'granted' | 'default' | 'loading';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;

  useEffect(() => {
    if (!isSupported) { setState('unsupported'); return; }
    setState(Notification.permission as PushState);
    // Регистрируем SW
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Проверяем текущую подписку
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscription(sub);
      });
    }).catch(() => {});
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      setState('loading');
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return false;
      }
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const subscribeOptions: PushSubscriptionOptionsInit = { userVisibleOnly: true };
        if (VAPID_PUBLIC_KEY) {
          subscribeOptions.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        }
        sub = await reg.pushManager.subscribe(subscribeOptions);
      }
      setSubscription(sub);
      setState('granted');
      // Сохраняем подписку на сервере
      await saveSubscription(sub);
      return true;
    } catch {
      setState(Notification.permission as PushState);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) return;
    try {
      await removeSubscription(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setState('default');
    } catch { /* silent */ }
  }, [subscription]);

  return { state, subscription, subscribe, unsubscribe, isSupported };
}

async function saveSubscription(sub: PushSubscription) {
  const userId = localStorage.getItem('user_id');
  const json = sub.toJSON();
  const keys = json.keys || {};
  await fetch(`${API_URLS.users}&action=push_subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'push_subscribe',
      endpoint: sub.endpoint,
      p256dh: keys.p256dh || '',
      auth: keys.auth || '',
      user_id: userId ? parseInt(userId) : null,
    }),
  }).catch(() => {});
}

async function removeSubscription(endpoint: string) {
  await fetch(`${API_URLS.users}&action=push_unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'push_unsubscribe', endpoint }),
  }).catch(() => {});
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}
