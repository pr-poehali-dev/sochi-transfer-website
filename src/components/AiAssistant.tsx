import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const QUICK_QUESTIONS = [
  'Сколько стоит трансфер до Адлера?',
  'Какие классы авто есть?',
  'Как заказать трансфер?',
  'Едете в Абхазию?',
];

const AiAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Привет! Я ИИ-помощник ПоехалиПро. Спросите меня о трансферах, маршрутах или ценах.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await fetch(API_URLS.ai, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.answer || data.error || 'Не могу ответить сейчас.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Ошибка соединения. Попробуйте позже.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="ИИ-помощник"
      >
        {open
          ? <Icon name="X" className="h-6 w-6 text-white" />
          : <Icon name="Bot" className="h-6 w-6 text-white" />
        }
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {/* Header */}
          <div className="gradient-primary px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name="Bot" className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">ИИ-помощник</p>
              <p className="text-white/70 text-xs">ПоехалиПро · онлайн</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'gradient-primary text-white rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ваш вопрос..."
              className="h-9 text-sm"
              disabled={loading}
            />
            <Button size="sm" className="h-9 w-9 p-0 gradient-primary text-white flex-shrink-0"
              onClick={() => send()} disabled={loading || !input.trim()}>
              <Icon name="Send" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
