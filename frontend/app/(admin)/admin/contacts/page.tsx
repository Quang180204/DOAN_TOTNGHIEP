'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ActionMenu from '@/components/admin/common/ActionMenu';

interface ThreadMessage {
  id: string;
  senderRole: 'client' | 'admin';
  senderName: string;
  body: string;
  createdAt: string;
}

interface ContactThread {
  contact_id: number;
  name: string;
  email: string;
  subject: string;
  preview: string;
  status: string;
  create_at: string;
  messages: ThreadMessage[];
}

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ContactThread | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contacts', { params: { page: currentPage, size: 10 } });
      if (res.data.success) {
        setMessages(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Không thể tải tin nhắn liên hệ');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleReply = async () => {
    if (!selected || !reply.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/admin/contacts/${selected.contact_id}/reply`, { reply });
      if (res.data.success) {
        toast.success('Phản hồi thành công');
        setSelected(res.data.data);
        setReply('');
        setMessages((prev) => prev.map((item) => (item.contact_id === selected.contact_id ? res.data.data : item)));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Phản hồi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/admin/contacts/${selected.contact_id}`);
      if (res.data.success) {
        toast.success('Đã xóa phản hồi');
        setMessages((prev) => prev.filter((item) => item.contact_id !== selected.contact_id));
        setSelected(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa phản hồi thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phản hồi khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi và trả lời hội thoại hỗ trợ từ khách hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Tin nhắn gần nhất</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Ngày gửi</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <tr key={msg.contact_id} className="hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{msg.name}</div>
                    <div className="text-xs text-gray-500">{msg.email}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{msg.subject}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-md">
                    <p className="line-clamp-2">{msg.preview}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${msg.status === '2' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {msg.status === '2' ? 'Admin nhắn cuối' : 'Khách nhắn cuối'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">{formatDate(msg.create_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <ActionMenu
                        items={[
                          {
                            label: 'Phản hồi',
                            onClick: () => {
                              setSelected(msg);
                              setReply('');
                            }
                          },
                          {
                            label: 'Xóa phản hồi',
                            tone: 'danger',
                            onClick: () => {
                              setSelected(msg);
                              setReply('');
                            }
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">Chưa có tin nhắn liên hệ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-500">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">{selected.subject}</h2>
                <p className="text-sm text-gray-500">{selected.name} • {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl p-4 ${message.senderRole === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold text-gray-900">{message.senderRole === 'admin' ? 'Admin' : message.senderName}</p>
                    <span className="text-xs text-gray-400">{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{message.body}</p>
                </div>
              ))}
            </div>

            <div className="px-6 pb-4">
              <textarea
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung phản hồi..."
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between gap-3">
              <button disabled={deleting} onClick={handleDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white disabled:opacity-60">
                {deleting ? 'Đang xóa...' : 'Xóa phản hồi'}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="px-5 py-2.5 border rounded-xl bg-white">Hủy</button>
                <button disabled={submitting} onClick={handleReply} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-60">
                  {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
