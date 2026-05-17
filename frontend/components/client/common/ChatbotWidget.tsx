'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

type ProductSuggestion = {
  product_id: number;
  product_name: string;
  image: string;
  price: number;
  priceAfterDiscount: number;
  brand_name: string;
  genre_name: string;
  quantity: string | null;
};

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  products?: ProductSuggestion[];
};

const formatCurrency = (value: number) => `${(value || 0).toLocaleString('vi-VN')}đ`;
const createConversationId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getWelcomeMessage = (): Message => ({
  id: 'assistant-welcome',
  role: 'assistant',
  content:
    'Chào bạn. Tôi là AI tư vấn của Quang\'s Shop. Bạn có thể hỏi về thương hiệu, tầm giá, laptop giảm giá, phụ kiện, so sánh sản phẩm hoặc đơn hàng của mình.',
});

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userId = localStorage.getItem('userId') || 'guest';
    const storageKey = `chatbot-session-${userId}`;
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      const nextConversationId = createConversationId();
      const initialMessages = [getWelcomeMessage()];
      setConversationId(nextConversationId);
      setMessages(initialMessages);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          conversationId: nextConversationId,
          messages: initialMessages,
        })
      );
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setConversationId(parsed?.conversationId || createConversationId());
      setMessages(Array.isArray(parsed?.messages) && parsed.messages.length ? parsed.messages : [getWelcomeMessage()]);
    } catch {
      const nextConversationId = createConversationId();
      setConversationId(nextConversationId);
      setMessages([getWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !conversationId) return;
    const userId = localStorage.getItem('userId') || 'guest';
    const storageKey = `chatbot-session-${userId}`;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        conversationId,
        messages,
      })
    );
  }, [conversationId, messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading && !!conversationId, [input, isLoading, conversationId]);

  const resetConversation = () => {
    const nextConversationId = createConversationId();
    setConversationId(nextConversationId);
    setMessages([getWelcomeMessage()]);
    setInput('');
  };

  const askBot = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || !conversationId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = nextMessages.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await api.post('/chatbot/message', {
        message: trimmedMessage,
        history: historyPayload,
        conversationId,
      });

      const payload = response.data?.data;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload?.answer || 'Tôi chưa thể trả lời lúc này.',
          products: payload?.products || [],
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: error?.response?.data?.message || 'Có lỗi khi kết nối chatbot. Bạn thử lại sau ít phút.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-[40] flex h-[720px] max-h-[78vh] w-[min(96vw,570px)] flex-col overflow-hidden rounded-[28px] border border-white/20 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl shadow-inner shadow-white/20">
                  🤖
                </div>
                <div>
                  <div className="text-lg font-semibold leading-none">Quang&apos;s Shop AI</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/90">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
                    Đang hoạt động
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-xl bg-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/25"
                >
                  Phiên mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl text-white transition hover:bg-white/25"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-lg text-violet-200">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-[22px] border px-4 py-3 text-[15px] leading-7 shadow-sm ${
                    message.role === 'user'
                      ? 'border-cyan-400/30 bg-cyan-500 text-white'
                      : 'border-slate-700 bg-slate-900 text-slate-100'
                  }`}
                >
                  <p>{message.content}</p>

                  {!!message.products?.length && (
                    <div className="mt-4 space-y-3">
                      {message.products.map((product) => (
                        <Link
                          key={product.product_id}
                          href={`/products/${product.product_id}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 p-3 transition hover:border-cyan-400/40 hover:bg-slate-900"
                        >
                          <img
                            src={getMediaUrl(product.image, '/images/default.png')}
                            alt={product.product_name}
                            className="h-20 w-20 rounded-xl object-cover bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium leading-6 text-white">{product.product_name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                              {product.brand_name || product.genre_name || 'Sản phẩm nổi bật'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm font-semibold text-cyan-300">{formatCurrency(product.priceAfterDiscount)}</span>
                              {product.priceAfterDiscount < product.price && (
                                <span className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-lg text-violet-200">
                  🤖
                </div>
                <div className="rounded-[22px] border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                  Đang tìm dữ liệu sản phẩm phù hợp...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 bg-slate-950 px-4 py-4">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    askBot(input);
                  }
                }}
                placeholder="Nhập câu hỏi về sản phẩm..."
                className="h-14 flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-sm text-white outline-none transition focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => askBot(input)}
                disabled={!canSend}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-lg text-white shadow-lg shadow-cyan-500/20 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-[39]">
        {isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-red-500 px-6 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(239,68,68,0.35)] transition hover:bg-red-600"
          >
            Đóng
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-4 text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition hover:scale-[1.02]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl">🤖</span>
            <span className="text-left">
              <span className="block text-sm font-semibold leading-none">AI hỗ trợ mua sắm</span>
              <span className="mt-1 block text-xs text-white/85">Hỏi sản phẩm, giá, khuyến mãi</span>
            </span>
          </button>
        )}
      </div>
    </>
  );
}
