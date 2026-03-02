import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

interface ChatMessage {
  id: number;
  sender_type: 'driver' | 'user' | 'ai';
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface OrderChatProps {
  orderId: number;
  senderType: 'driver' | 'user';
  senderId: number;
  compact?: boolean;
}

const OrderChat = ({ orderId, senderType, senderId, compact = false }: OrderChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const headerKey = senderType === 'driver' ? 'X-Driver-Id' : 'X-User-Id';

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URLS.chat}?resource=chat&order_id=${orderId}`, {
        headers: { [headerKey]: String(senderId) },
      });
      const data = await r.json();
      setMessages(data.messages || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    try {
      await fetch(`${API_URLS.chat}?resource=chat&order_id=${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [headerKey]: String(senderId) },
        body: JSON.stringify({ message: msg }),
      });
      await load();
    } catch { /* silent */ }
    setSending(false);
  };

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type !== senderType).length;

  const formatTime = (dt: string) => {
    try {
      return new Date(dt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden ${compact ? 'h-64' : 'h-80'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b flex-shrink-0">
        <Icon name="MessageCircle" className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium flex-1">
          {senderType === 'driver' ? 'Чат с пассажиром' : 'Чат с водителем'}
        </span>
        {unreadCount > 0 && (
          <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
        )}
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="RefreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && !loading && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Начните переписку с {senderType === 'driver' ? 'пассажиром' : 'водителем'}
          </p>
        )}
        {messages.map(m => {
          const isMe = m.sender_type === senderType;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-2.5 py-1.5 rounded-2xl text-sm ${
                isMe ? 'gradient-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <p className="leading-relaxed">{m.message}</p>
                <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/60' : 'text-muted-foreground'} text-right`}>
                  {formatTime(m.created_at)}
                  {isMe && m.is_read && <span className="ml-1">✓✓</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t flex gap-2 flex-shrink-0">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Сообщение..."
          className="h-8 text-sm"
          disabled={sending}
        />
        <Button size="sm" className="h-8 w-8 p-0 gradient-primary text-white flex-shrink-0"
          onClick={sendMessage} disabled={sending || !input.trim()}>
          {sending
            ? <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
            : <Icon name="Send" className="h-3.5 w-3.5" />
          }
        </Button>
      </div>
    </div>
  );
};

export default OrderChat;
