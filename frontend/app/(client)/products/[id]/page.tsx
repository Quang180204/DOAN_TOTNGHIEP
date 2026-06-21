'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import { StarIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';

interface Product {
  product_id: number;
  product_name: string;
  price: string;
  priceAfterDiscount: string;
  view: string;
  buyturn: string;
  quantity: string;
  image: string;
  description: string;
  specifications: string;
  avgRating: number;
  Type: number;
  discount: {
    discount_price: number;
    discount_star: string;
    discount_end: string;
  } | null;
  genre: { genre_id: number; genre_name: string };
  brand: { brand_id: number; brand_name: string };
  images: { image: string }[];
}

interface Feedback {
  feedback_id: number;
  account_id: number;
  content: string;
  rate_star: number;
  create_at: string;
  account: { Name: string; Avatar: string };
  replies: FeedbackReply[];
}

interface FeedbackReply {
  rep_feedback_id: number;
  feedback_id: number;
  account_id: number;
  content: string;
  create_at: string;
  account: {
    Name: string;
    Avatar: string;
    account_id: number;
  } | null;
}

const repairText = (value?: string | null) => {
  if (!value) return '';
  try {
    const repaired = decodeURIComponent(escape(value));
    return repaired;
  } catch {
    return value;
  }
};

const stripHtml = (html: string) => {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      isWishlisted(parseInt(id, 10)).then(setWishlisted);
    } else {
      setWishlisted(false);
    }
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        setRelatedProducts(res.data.relatedProducts || []);
        setFeedbacks(res.data.feedbacks?.data || []);
        setSelectedImage(res.data.product.image);
      }
    } catch (error) {
      console.error('ProductDetail fetchProduct error:', error);
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      sessionStorage.setItem('postAuthReturnUrl', window.location.pathname);
      window.location.href = '/account/login?return=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const res = await api.post('/cart/add', { productId: parseInt(id, 10), quantity });
      if (res.data.success) {
        toast.success('Đã thêm vào giỏ hàng');
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch {
      toast.error('Thêm vào giỏ hàng thất bại');
    }
  };

  const buyNow = async () => {
    const checkoutUrl = `/checkout?buyNow=${id}&buyNowQuantity=${quantity}`;
    if (!localStorage.getItem('token')) {
      toast.error('Bạn cần đăng nhập để tiếp tục thanh toán');
      sessionStorage.setItem('postAuthReturnUrl', checkoutUrl);
      window.location.href = `/account/login?return=${encodeURIComponent(checkoutUrl)}`;
      return;
    }

    try {
      await api.put('/cart/update', { productId: parseInt(id, 10), quantity });
    } catch {
      await api.post('/cart/add', { productId: parseInt(id, 10), quantity });
    }

    window.location.href = checkoutUrl;
  };

  const handleToggleWishlist = async () => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để thêm yêu thích');
      sessionStorage.setItem('pendingWishlistProductId', id);
      sessionStorage.setItem('postAuthReturnUrl', window.location.pathname);
      window.location.href = '/account/login?return=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const result = await toggleWishlist(parseInt(id, 10));
      const added = result?.action === 'added';
      setWishlisted(added);
      toast.success(added ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật yêu thích');
    }
  };

  const repairedDescription = useMemo(() => repairText(product?.description), [product?.description]);
  const repairedSpecifications = useMemo(() => repairText(product?.specifications), [product?.specifications]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl text-red-600">Không tìm thấy sản phẩm</h1>
        <Link href="/" className="mt-4 inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const price = parseInt(product.price, 10);
  const finalPrice = parseInt(product.priceAfterDiscount, 10);
  const discountPercent = price > 0 ? (((price - finalPrice) / price) * 100).toFixed(0) : '0';
  const isInStock = parseInt(product.quantity, 10) > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-yellow-600">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/products/${product.Type === 1 ? 'laptop' : 'accessories'}`} className="hover:text-yellow-600">
          {product.Type === 1 ? 'Laptop' : 'Phụ kiện'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{repairText(product.product_name)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="border rounded-lg overflow-hidden bg-white">
            <img
              src={getMediaUrl(selectedImage || product.image, '/images/default.png')}
              alt={repairText(product.product_name)}
              className="w-full h-96 object-contain"
            />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto">
            <button
              onClick={() => setSelectedImage(product.image)}
              className={`border rounded-lg p-1 ${selectedImage === product.image ? 'border-yellow-500' : 'border-gray-200'}`}
            >
              <img src={getMediaUrl(product.image, '/images/default.png')} alt="" className="w-20 h-20 object-cover rounded" />
            </button>
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img.image)}
                className={`border rounded-lg p-1 ${selectedImage === img.image ? 'border-yellow-500' : 'border-gray-200'}`}
              >
                <img src={getMediaUrl(img.image, '/images/default.png')} alt="" className="w-20 h-20 object-cover rounded" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{repairText(product.product_name)}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) =>
                star <= Math.round(product.avgRating) ? (
                  <StarSolidIcon key={star} className="w-5 h-5 fill-current" />
                ) : (
                  <StarIcon key={star} className="w-5 h-5 stroke-current" />
                )
              )}
            </div>
            <span className="text-gray-500">({feedbacks.length} đánh giá)</span>
          </div>

          <div className="mb-4">
            {finalPrice < price ? (
              <>
                <span className="text-3xl font-bold text-red-600">{finalPrice.toLocaleString('vi-VN')}đ</span>
                <span className="text-gray-400 line-through ml-3">{price.toLocaleString('vi-VN')}đ</span>
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded text-sm">-{discountPercent}%</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-red-600">{price.toLocaleString('vi-VN')}đ</span>
            )}
          </div>

          <div className="mb-4">
            {isInStock ? (
              <span className="text-green-600">Còn hàng ({parseInt(product.quantity, 10).toLocaleString('vi-VN')} sản phẩm)</span>
            ) : (
              <span className="text-red-600">Hết hàng</span>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Khuyến mãi liên quan</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>Nhập mã QUANG300 giảm 3% tối đa 300.000đ</li>
              <li>Nhập mã QUANG800 giảm 4% tối đa 800.000đ</li>
            </ul>
          </div>

          {isInStock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-100">
                  -
                </button>
                <span className="px-6 py-2 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(parseInt(product.quantity, 10), quantity + 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button onClick={addToCart} className="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition">
                Thêm vào giỏ
              </button>
              <button onClick={buyNow} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition">
                Mua ngay
              </button>
            </div>
          )}

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex">
              <span className="w-24 text-gray-500">Thương hiệu:</span>
              <span className="text-gray-700">{repairText(product.brand?.brand_name) || 'Đang cập nhật'}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-500">Danh mục:</span>
              <span className="text-gray-700">{repairText(product.genre?.genre_name) || 'Đang cập nhật'}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-500">Lượt xem:</span>
              <span>{parseInt(product.view, 10).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-500">Đã bán:</span>
              <span>{parseInt(product.buyturn, 10).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <button onClick={handleToggleWishlist} className="ml-auto text-gray-500 hover:text-red-500 flex items-center gap-1">
              {wishlisted ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />} Yêu thích
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="border-b flex gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-2 font-medium ${activeTab === 'description' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
          >
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('specification')}
            className={`pb-3 px-2 font-medium ${activeTab === 'specification' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
          >
            Thông số kỹ thuật
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 font-medium ${activeTab === 'reviews' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
          >
            Đánh giá ({feedbacks.length})
          </button>
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div
              className="prose max-w-none prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
              dangerouslySetInnerHTML={{ __html: repairedDescription || 'Chưa có mô tả' }}
            />
          )}
          {activeTab === 'specification' && (
            <div
              className="prose max-w-none prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
              dangerouslySetInnerHTML={{ __html: repairedSpecifications || 'Đang cập nhật' }}
            />
          )}
          {activeTab === 'reviews' && (
            <div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 mb-6 text-sm text-blue-700">
                Đánh giá sản phẩm chỉ được gửi trong chi tiết đơn hàng sau khi đơn đã hoàn thành.
              </div>

              <div className="space-y-6">
                {feedbacks.length === 0 ? (
                  <div className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</div>
                ) : (
                  feedbacks.map((fb) => (
                    <div key={fb.feedback_id} className="border-b pb-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={getMediaUrl(fb.account?.Avatar, '/images/default.png')}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h4 className="font-semibold">{repairText(fb.account?.Name)}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex text-yellow-400">
                                  {[1, 2, 3, 4, 5].map((star) =>
                                    star <= fb.rate_star ? (
                                      <StarSolidIcon key={star} className="w-4 h-4 fill-current" />
                                    ) : (
                                      <StarIcon key={star} className="w-4 h-4 stroke-current" />
                                    )
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(fb.create_at).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-700">{repairText(stripHtml(fb.content))}</p>

                          {fb.replies?.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {fb.replies.map((reply) => (
                                <div
                                  key={reply.rep_feedback_id}
                                  className="rounded-lg border border-blue-100 bg-blue-50/70 p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    <img
                                      src={getMediaUrl(reply.account?.Avatar, '/images/default.png')}
                                      alt={repairText(reply.account?.Name) || 'Quản trị viên'}
                                      className="h-9 w-9 rounded-full border border-blue-200 bg-white object-cover"
                                      onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = '/images/default.png';
                                      }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="font-semibold text-blue-900">
                                          {repairText(reply.account?.Name) || 'Quản trị viên'}
                                        </span>
                                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                          Phản hồi từ cửa hàng
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {new Date(reply.create_at).toLocaleString('vi-VN')}
                                        </span>
                                      </div>
                                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                                        {repairText(stripHtml(reply.content))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link key={item.product_id} href={`/products/${item.product_id}`} className="border rounded-lg p-4 hover:shadow-lg transition">
                <img
                  src={getMediaUrl(item.image, '/images/default.png')}
                  alt={repairText(item.product_name)}
                  className="w-full h-40 object-cover mb-3 rounded"
                />
                <h3 className="font-medium line-clamp-2 text-sm">{repairText(item.product_name)}</h3>
                <p className="text-red-600 font-bold mt-2">{parseInt(item.priceAfterDiscount, 10).toLocaleString('vi-VN')}đ</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
