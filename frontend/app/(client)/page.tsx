'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, ShieldCheckIcon, SparklesIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import ProductCard from '@/components/client/common/ProductCard';

interface Product {
  product_id: number;
  product_name: string;
  price: string;
  priceAfterDiscount: string;
  image: string;
  quantity: string;
  avgRating?: number;
}

const heroSlides = [
  {
    image: '/images/anh0.jpg',
    badge: 'Laptop chính hãng',
    title: 'Laptop và phụ kiện công nghệ chính hãng.',
    description: 'Không gian mua sắm rõ ràng hơn, tập trung vào hình ảnh thật và các đợt ưu đãi chính.',
    href: '/products/laptop',
    cta: 'Xem laptop'
  },
  {
    image: '/images/anh2.jpg',
    badge: 'Phụ kiện công nghệ',
    title: 'Phụ kiện đồng bộ cho học tập, làm việc và giải trí.',
    description: 'Từ chuột, bàn phím đến ổ cứng và hub chuyển đổi, mọi thứ được gom lại theo nhóm rõ ràng.',
    href: '/products/accessories',
    cta: 'Xem phụ kiện'
  },
  {
    image: '/images/anh2+.jpg',
    badge: 'Ưu đãi theo mùa',
    title: 'Theo dõi đợt giảm giá mới mà không bị rối mắt.',
    description: 'Banner quay vòng tự động sau mỗi 5 giây, giữ trọng tâm vào sản phẩm và khuyến mãi chính.',
    href: '/products/laptop',
    cta: 'Mua ngay'
  },
  {
    image: '/images/anh3.jpg',
    badge: 'Thiết bị nổi bật',
    title: 'Chọn nhanh cấu hình phù hợp với công việc của bạn.',
    description: 'Tập hợp các mẫu học tập, văn phòng, đồ họa và gaming theo nhu cầu sử dụng thực tế.',
    href: '/products/laptop',
    cta: 'Khám phá'
  },
  {
    image: '/images/anh4.jpg',
    badge: 'Phụ kiện đồng bộ',
    title: 'Bổ sung đủ phụ kiện trước khi chốt đơn.',
    description: 'Chuột, bàn phím, ổ cứng, tai nghe và nhiều lựa chọn đi kèm được sắp xếp dễ chọn hơn.',
    href: '/products/accessories',
    cta: 'Xem phụ kiện'
  }
];

const features = [
  {
    title: 'Giao hàng toàn quốc',
    description: 'Đóng gói kỹ, theo dõi vận chuyển rõ ràng và tối ưu cho thiết bị điện tử.',
    icon: TruckIcon
  },
  {
    title: 'Bảo hành chính hãng',
    description: 'Sản phẩm được kiểm tra trước khi giao và giữ thông tin bảo hành rõ ràng.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Đổi trả minh bạch',
    description: 'Quy trình gọn, ít bước thừa, thể hiện trạng thái rõ theo từng giai đoạn.',
    icon: ArrowPathIcon
  },
  {
    title: 'Tư vấn đúng nhu cầu',
    description: 'Ưu tiên gợi ý cấu hình và phụ kiện phù hợp thay vì đẩy mua theo giá cao.',
    icon: SparklesIcon
  }
];

function ProductSection({
  title,
  description,
  href,
  products
}: {
  title: string;
  description: string;
  href: string;
  products: Product[];
}) {
  if (!products.length) return null;

  return (
    <section className="section-shell">
      <div className="container-custom">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-heading">{title}</h2>
            <p className="section-copy">{description}</p>
          </div>
          <Link href={href} className="btn-secondary w-fit">
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [laptops, setLaptops] = useState<Product[]>([]);
  const [accessories, setAccessories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/home');
        if (res.data.success) {
          setHotProducts(res.data.data.hotProduct || []);
          setNewProducts(res.data.data.newProduct || []);
          setLaptops(res.data.data.laptop || []);
          setAccessories(res.data.data.accessory || []);
        }
      } catch (error) {
        console.error('Lỗi tải trang chủ:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      const res = await api.post('/newsletter/subscribe', { email: newsletterEmail });
      toast.success(res.data.message || 'Đăng ký thành công');
      setNewsletterEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-24">
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="skeleton h-[360px] rounded-[32px]" />
          <div className="grid gap-6">
            <div className="skeleton h-[168px] rounded-[28px]" />
            <div className="skeleton h-[168px] rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <section className="container-custom pt-6">
        <div className="surface-card overflow-hidden rounded-[32px] p-3">
          <div className="relative overflow-hidden rounded-[28px]">
            <div className="relative aspect-[16/5] min-h-[260px] w-full">
              {heroSlides.map((slide, index) => (
                <Link
                  key={slide.title}
                  href="/products/laptop"
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
                </Link>
              ))}

                <div className="absolute bottom-5 left-5 flex items-center gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={`${slide.image}-${index}`}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                      }`}
                      aria-label={`Chuyển đến slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="absolute bottom-5 right-5 flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-slate-950/25 text-white backdrop-blur hover:bg-slate-950/45"
                    aria-label="Slide trước"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-slate-950/25 text-white backdrop-blur hover:bg-slate-950/45"
                    aria-label="Slide tiếp theo"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </section>

      <section className="section-shell">
        <div className="container-custom">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const tints = [
                'from-sky-500 to-cyan-500',
                'from-blue-500 to-indigo-500',
                'from-fuchsia-500 to-indigo-500',
                'from-cyan-500 to-emerald-500'
              ];
              return (
                <div key={feature.title} className="surface-card p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tints[index]} text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.7)]`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ProductSection
        title="Sản phẩm bán chạy"
        description="Những mẫu được quan tâm và mua nhiều trong thời gian gần đây."
        href="/products/laptop"
        products={hotProducts}
      />
      <ProductSection
        title="Sản phẩm mới"
        description="Các mẫu vừa được cập nhật lên hệ thống."
        href="/products/laptop"
        products={newProducts}
      />
      <ProductSection
        title="Laptop"
        description="Nhóm sản phẩm chính với các cấu hình phổ biến và dễ chọn."
        href="/products/laptop"
        products={laptops}
      />
      <ProductSection
        title="Phụ kiện"
        description="Các phụ kiện đi kèm cho học tập, làm việc và giải trí."
        href="/products/accessories"
        products={accessories}
      />

      <section className="container-custom section-shell">
        <div className="tech-panel overflow-hidden rounded-[32px] border border-cyan-300/14 px-6 py-10 shadow-[0_24px_60px_-30px_rgba(37,99,235,0.6)] sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">Đăng ký nhận tin</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Nhận thông tin khuyến mãi và sản phẩm mới nhất.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white">
                Hệ thống sẽ gửi email xác nhận sau khi đăng ký thành công.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="grid gap-3 sm:grid-cols-[1fr,auto]">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Email của bạn"
                className="h-12 rounded-xl border border-cyan-300/12 bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Đăng ký ngay
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
