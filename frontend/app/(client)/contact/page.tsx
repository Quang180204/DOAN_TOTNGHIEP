'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface ContactMessage {
  id: string;
  senderRole: 'client' | 'admin';
  senderName: string;
  body: string;
  createdAt: string;
}

interface ContactThread {
  contact_id: number;
  subject: string;
  status: string;
  messages: ContactMessage[];
  create_at: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadContactData = async () => {
      try {
        const [profileRes, contactsRes] = await Promise.all([api.get('/account/profile'), api.get('/contact/my')]);

        if (profileRes.data.success) {
          setFormData((prev) => ({
            ...prev,
            name: profileRes.data.user?.Name || '',
            email: profileRes.data.user?.email || ''
          }));
        }

        if (contactsRes.data.success) {
          setThreads(contactsRes.data.data || []);
        }
      } catch {
        toast.error('Vui lòng đăng nhập để gửi liên hệ');
      }
    };

    loadContactData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/contact', {
        subject: formData.subject,
        message: formData.message
      });

      if (res.data.success) {
        toast.success('Phản hồi đã gửi');
        setThreads((prev) => [res.data.data, ...prev]);
        setFormData((prev) => ({ ...prev, subject: '', message: '' }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi tin nhắn thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (contactId: number) => {
    const message = (replyDrafts[contactId] || '').trim();
    if (!message) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      const res = await api.post(`/contact/${contactId}/reply`, { message });
      if (res.data.success) {
        setThreads((prev) => prev.map((thread) => (thread.contact_id === contactId ? res.data.data : thread)));
        setReplyDrafts((prev) => ({ ...prev, [contactId]: '' }));
        toast.success('Đã gửi phản hồi');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi phản hồi');
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Liên hệ</span>
      </div>

      <div className="mb-8 max-w-3xl">
        <h1 className="section-heading">Liên hệ và phản hồi</h1>
        <p className="section-copy">Gửi câu hỏi cho quản trị viên và theo dõi toàn bộ hội thoại phản hồi ngay trên trang này.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[360px,1fr]">
        <aside className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin liên hệ</h2>
          <div className="mt-6 space-y-5">
            {[
              { icon: MapPinIcon, title: 'Địa chỉ', value: '12 Ngô Xuân Quảng, Gia Lâm, Hà Nội' },
              { icon: PhoneIcon, title: 'Điện thoại', value: '0986 951 018' },
              { icon: EnvelopeIcon, title: 'Email', value: 'quang180204@gmail.com' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-900">Giờ làm việc</p>
            <p className="mt-2 text-sm text-slate-600">Thứ 2 - Thứ 7: 8:00 - 21:00</p>
            <p className="mt-1 text-sm text-slate-600">Chủ nhật: 9:00 - 18:00</p>
          </div>
        </aside>

        <section className="space-y-8">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Gửi tin nhắn cho chúng tôi</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Họ tên</label>
                  <input type="text" value={formData.name} readOnly className="input-modern bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" value={formData.email} readOnly className="input-modern bg-slate-50 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nội dung</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="input-modern min-h-[160px] resize-none py-3"
                  placeholder="Nhập nội dung tin nhắn..."
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          </div>

          {threads.length > 0 && (
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-slate-900">Phản hồi đã gửi</h3>
              <div className="mt-6 space-y-5">
                {threads.map((thread) => (
                  <div key={thread.contact_id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{thread.subject}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(thread.create_at).toLocaleString('vi-VN')}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${thread.status === '2' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {thread.status === '2' ? 'Admin vừa trả lời' : 'Bạn là người nhắn cuối'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {thread.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-2xl px-4 py-3 ${
                            message.senderRole === 'admin'
                              ? 'border border-emerald-100 bg-white'
                              : 'border border-slate-200 bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className={`text-xs font-semibold ${message.senderRole === 'admin' ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {message.senderRole === 'admin' ? 'Admin' : 'Bạn'}
                            </p>
                            <span className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{message.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      <textarea
                        rows={3}
                        value={replyDrafts[thread.contact_id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.contact_id]: e.target.value }))}
                        placeholder="Trả lời tiếp trong phản hồi này..."
                        className="input-modern min-h-[120px] resize-none py-3"
                      />
                      <div className="flex justify-end">
                        <button onClick={() => handleReply(thread.contact_id)} className="btn-primary">
                          Gửi phản hồi tiếp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
