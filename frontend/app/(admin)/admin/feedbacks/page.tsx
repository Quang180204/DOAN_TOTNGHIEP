'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ActionMenu from '@/components/admin/common/ActionMenu';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import { getMediaUrl } from '@/lib/media';

interface Feedback {
  feedback_id: number;
  product_id: number;
  product_name: string;
  account_name: string;
  account?: {
    Avatar?: string;
  };
  rate_star: number;
  content: string;
  create_at: string;
  replies?: Reply[];
}

interface Reply {
  rep_feedback_id: number;
  content: string;
  create_at: string;
  account_name?: string;
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/feedbacks', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setFeedbacks(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    if (!selectedFeedback) return;

    setSubmitting(true);
    try {
      await api.post('/admin/feedbacks/reply', {
        feedbackId: selectedFeedback.feedback_id,
        replyContent
      });
      toast.success('Phản hồi thành công');
      setShowReplyModal(false);
      setReplyContent('');
      fetchFeedbacks();
    } catch {
      toast.error('Phản hồi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeedback) return;

    try {
      const res = await api.delete(`/admin/feedbacks/delete/${selectedFeedback.feedback_id}`);
      if (res.data.success) {
        toast.success('Xóa đánh giá thành công');
        fetchFeedbacks();
      } else {
        toast.error(res.data.message || 'Xóa đánh giá thất bại');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Xóa đánh giá thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedFeedback(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <i key={star} className={`bi bi-star${star <= rating ? '-fill' : ''} text-sm mr-0.5 drop-shadow-sm`}></i>
        ))}
      </div>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
            <i className="bi bi-star-half text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Đánh giá</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <Link href="/admin" className="cursor-pointer hover:text-blue-600 transition-colors">
                Bảng điều khiển
              </Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Phản hồi của khách hàng</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50 rounded-t-2xl">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all shadow-sm"
              placeholder="Tìm kiếm theo khách hàng, sản phẩm..."
            />
          </form>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-500">ID</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Người dùng</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Sản phẩm</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Đánh giá</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Nội dung</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Ngày gửi</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feedbacks.map((fb) => (
                <tr key={fb.feedback_id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-500">#{fb.feedback_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-indigo-200 bg-gradient-to-tr from-indigo-100 to-blue-50 flex-shrink-0">
                        <img
                          src={getMediaUrl(fb.account?.Avatar, '/images/default.png')}
                          alt={fb.account_name || 'Khách hàng'}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '/images/default.png';
                          }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 line-clamp-1">{fb.account_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/admin/products/${fb.product_id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 transition-colors line-clamp-2"
                      title={fb.product_name}
                    >
                      {fb.product_name}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">{renderStars(fb.rate_star)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[300px]">
                      <p className="text-gray-600 line-clamp-2 font-medium" title={stripHtml(fb.content)}>
                        &quot;{stripHtml(fb.content)}&quot;
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{formatDate(fb.create_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu
                      items={[
                        {
                          label: 'Phản hồi',
                          onClick: () => {
                            setSelectedFeedback(fb);
                            setReplyContent('');
                            setShowReplyModal(true);
                          }
                        },
                        {
                          label: 'Xóa đánh giá',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedFeedback(fb);
                            setShowDeleteModal(true);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {feedbacks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-3">
                        <i className="bi bi-star-half text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Chưa có đánh giá nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
            <span className="text-sm text-gray-500 font-medium">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return pageNum ? (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showReplyModal && selectedFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all animate-[modalIn_0.3s_ease-out]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i className="bi bi-reply-all-fill text-blue-600"></i> Phản hồi đánh giá
              </h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[100px]">Sản phẩm:</span>
                  <span className="font-bold text-gray-900">{selectedFeedback.product_name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[100px]">Người đánh giá:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-2">
                    {selectedFeedback.account_name}
                    <span className="flex text-amber-400 text-xs">{renderStars(selectedFeedback.rate_star)}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[100px]">Nội dung:</span>
                  <span className="text-gray-700 italic">&quot;{stripHtml(selectedFeedback.content)}&quot;</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phản hồi của bạn <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors resize-none"
                  placeholder="Nhập nội dung phản hồi. Nội dung này sẽ được hiển thị công khai trên trang sản phẩm..."
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReply}
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i> Gửi phản hồi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa đánh giá"
        message={`Bạn có chắc chắn muốn xóa đánh giá của "<strong class="text-red-600">${selectedFeedback?.account_name || ''}</strong>"?`}
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
