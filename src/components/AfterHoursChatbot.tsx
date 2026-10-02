import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Phone, MessageCircle, Mail, Sparkles, ChevronDown, User, AlertCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  quickActions?: Array<{ label: string; href: string }>;
  timestamp: string;
}

interface AfterHoursChatbotProps {
  lang?: Language;
  theme?: Theme;
}

export default function AfterHoursChatbot({ lang = 'en', theme = 'dark' }: AfterHoursChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang].chatbot;
  const isDark = theme === 'dark';

  // Initialize greeting on open
  
  // Lenis: freeze page scroll while the chat panel is open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    (window as any).lenis?.stop();
    return () => {
      (window as any).lenis?.start();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: t.greeting,
          quickActions: [
            { label: lang === 'np' ? 'सर्भिसिङ प्याकेज' : 'Check Service Pricing', href: '#pricing' },
            { label: lang === 'np' ? 'पालो बुक गर्नुहोस्' : 'Book Morning Slot', href: '#contact' },
            { label: `Call: ${BUSINESS_INFO.phone}`, href: `tel:${BUSINESS_INFO.phoneRaw}` }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, messages.length, t.greeting, lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((item) => item.sender === 'user' || item.sender === 'bot')
        .slice(-10)
        .map((item) => ({
          role: item.sender === 'user' ? 'user' : 'model',
          text: item.text
        }));

      const res = await fetch('/api/public/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationHistory,
          lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          quickActions: data.quickActions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Chat service unavailable');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: lang === 'np'
            ? `नमस्ते! नरेश मोटो रिपेयर सेन्टरमा स्वागत छ। हामी बिहान ६:०० देखि बेलुका ८:०० सम्म खुला छौं। आपतकालीन सहयोग वा सोधपुछको लागि फोन गर्नुहोस्: ${BUSINESS_INFO.phone}।`
            : `Namaste! You've reached Naresh Moto. For immediate help or booking, please call ${BUSINESS_INFO.phone} or visit Dhore pakahamainpur - 1, Dhore.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  return (
    <>
      {/* Floating Chat Launcher Button (left-bottom on desktop, hidden on mobile) */}
      <div className="mobile-assistant-fab fixed fixed-ui-bottom-left z-fab">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-xl shadow-[#ff3b19]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Open 24/7 AI Workshop Assistant"
          >
            <Bot className="w-5 h-5" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-amber-200 leading-none">{t.badge}</span>
              <span className="text-xs font-bold leading-tight mt-0.5">{lang === 'np' ? 'एआई सहायक सोध्नुहोस्' : 'Ask Workshop AI'}</span>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed bottom-4 left-4 sm:left-6 z-modal w-full max-w-sm sm:max-w-md h-[540px] max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-fade-in"
          style={{
            backgroundColor: isDark ? '#141724' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
          }}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#181c2b] border-white/10 text-white' : 'bg-neutral-50 border-black/8 text-neutral-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white shadow-md shadow-[#ff3b19]/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>{t.title}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-green" />
                </div>
                <div className={`text-[10px] ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  {t.subtitle}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg cursor-pointer ${
                isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
              }`}
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] ${
            isDark ? 'bg-black/20 border-white/5' : 'bg-neutral-100/60 border-black/5'
          }`}>
            {[
              t.quickDiagnostic,
              t.quickTiming,
              t.quickCost
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer text-[10px] ${
                  isDark
                    ? 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-[#ff3b19]/50 hover:text-white'
                    : 'bg-white border-black/10 text-neutral-700 hover:border-[#e8340f]/50 hover:text-neutral-900'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" data-lenis-prevent>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-accent/20 text-accent-text flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-accent text-white rounded-br-none'
                    : isDark
                      ? 'bg-[#1e2334] text-neutral-200 border border-white/10 rounded-bl-none'
                      : 'bg-neutral-100 text-neutral-900 border border-black/5 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Quick Action Links if returned by AI */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.quickActions.map((action, i) => (
                        <a
                          key={i}
                          href={action.href}
                          className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-300 transition-colors"
                        >
                          {action.label}
                        </a>
                      ))}
                    </div>
                  )}

                  <span className={`block text-[9px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-white/70' : isDark ? 'theme-text-muted' : 'theme-text-muted'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs theme-text-muted">
                <Bot className="w-4 h-4 text-accent-text animate-bounce" />
                <span>Naresh Moto AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-[#181c2b] border-white/10' : 'bg-neutral-50 border-black/8'
            }`}
          >
            <input
              type="text"
              placeholder={t.placeholder}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white disabled:opacity-50 transition-all cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
