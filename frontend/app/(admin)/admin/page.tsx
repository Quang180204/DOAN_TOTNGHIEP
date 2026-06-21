// app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== '0') {
      router.push('/account/login');
      return;
    }
    
    fetchDashboard();
  }, [router]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success && res.data.data) {
        setStats(res.data.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    totalRevenue: 234976000,
    totalOrders: 156,
    totalProducts: 45,
    totalUsers: 6300,
    revenuePercent: 2.6,
    ordersPercent: 5.2,
    productsPercent: -1.2,
    usersPercent: 12.5,
    revenueByMonth: [12.5, 15.8, 18.2, 22.5, 25.8, 30.2, 35.5, 38.2, 42.5, 45.8, 48.2, 52.5],
    ordersByMonth: [10, 12, 15, 18, 22, 28, 32, 35, 38, 42, 45, 48],
    topProducts: [
      { product_id: 1, product_name: 'Asus VivoBook A515EP i5 1135G7/8GB/512GB/2GB...', sold: 90, price: 20790000, revenue: 1871100000, image: 'https://cdn.tgdd.vn/Products/Images/44/281483/asus-vivobook-a515ea-i5-bn1624w-1-1.jpg' },
    ],
    recentOrders: [
      { order_id: 84, oder_date: '2024-05-14T03:31:00', total: 57120000, status: '0', customer_name: 'Hậu Ngô', phone: '0987654321' },
      { order_id: 85, oder_date: '2024-05-14T03:31:00', total: 102610000, status: '3', customer_name: 'Hậu Ngô', phone: '0987654321' },
    ],
    revenueByCategory: { laptop: 1250000000, accessory: 250000000 },
    revenueByCategoryToday: { laptop: 55000000, accessory: 12000000 },
  });

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount == null) return '0₫';
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const formatShortCurrency = (amount: number) => {
    if (isNaN(amount) || amount == null) return '0₫';
    if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'T';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'tr';
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '1': return <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-semibold">Chờ xử lý</span>;
      case '2': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">Đang xử lý</span>;
      case '3': return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold">Hoàn thành</span>;
      case '0': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">Đã hủy</span>;
      default: return <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold">Không rõ</span>;
    }
  };

  const safePercent = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return 0;
    return num;
  };

  const ordersChartData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [{
      label: 'Doanh thu (Tr)',
      data: stats?.revenueByMonth || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: '#38bdf8',
      borderRadius: 4,
      barThickness: 12,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: true, grid: { display: false } },
      y: { display: true, min: 0, grid: { color: '#f3f4f6' } }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1400px] mx-auto fade-in">
      {/* Breadcrumb / Title Bar */}
      <div className="flex items-center space-x-3 mb-8 bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Thống kê</h1>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center text-sm text-gray-500 space-x-2">
          <span className="cursor-pointer hover:text-blue-600 font-medium transition-colors">Bảng điều khiển</span>
          <span className="text-gray-400">-</span>
          <span className="font-semibold text-gray-800">Thống kê</span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Small Stats (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 text-lg font-medium">₫</span>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{formatShortCurrency(stats?.totalRevenue || 0).replace('₫','')}</h2>
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-8">Ước tính doanh thu</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-500">Laptop</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{formatShortCurrency(stats?.revenueByCategory?.Laptop || 0)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-sm font-medium text-gray-500">P.Kiện</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{formatShortCurrency(stats?.revenueByCategory?.['Phụ kiện'] || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-bold text-gray-900 tracking-tight">{stats?.totalOrders || 0}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-600 flex items-center gap-1">
                  ↑ {safePercent(stats?.ordersPercent)}%
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium">Đơn hàng đã nhận</p>
          </div>
        </div>

        {/* Main Chart (Span 6) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="font-bold text-gray-900 text-lg">Biểu đồ doanh thu</h3>
                 <p className="text-gray-400 text-xs font-medium">Thống kê 12 tháng gần nhất (Triệu VNĐ)</p>
               </div>
               <div className="flex items-center gap-2">
                 <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                   <span className="w-2 h-2 rounded-full bg-blue-500"></span> Doanh thu
                 </span>
               </div>
             </div>
             <div className="flex-1 min-h-[300px]">
               <Bar data={ordersChartData} options={chartOptions} />
             </div>
          </div>
        </div>

        {/* Visitors & Active (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
             <div>
               <h2 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">{stats?.totalUsers || 0}</h2>
               <p className="text-gray-400 text-sm font-medium">Tổng tài khoản đăng ký</p>
             </div>
             
             <div className="mt-8 border-t border-gray-100 pt-6">
               <p className="text-[11px] font-bold text-green-600 mb-4 uppercase tracking-wide flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 Online hôm nay
               </p>
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm shadow-green-100">
                   <i className="bi bi-people-fill text-2xl"></i>
                 </div>
                 <div>
                   <span className="text-3xl font-extrabold text-gray-900">{stats?.activeUsers || 0}</span>
                   <p className="text-xs text-gray-500 font-semibold">Tài khoản truy cập</p>
                 </div>
               </div>
               
               <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                 <div className="flex justify-between items-center text-xs mb-2">
                   <span className="text-gray-500 font-medium">Tỷ lệ hoạt động</span>
                   <span className="text-gray-900 font-bold">{stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-green-500 rounded-full transition-all duration-1000" 
                     style={{ width: `${stats?.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }}
                   ></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Sản phẩm bán chạy nhất</h3>
              <p className="text-gray-400 text-xs font-medium">Top 5 sản phẩm đạt doanh số cao nhất</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wider">
                 <i className="bi bi-laptop"></i> Laptop
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-bold uppercase tracking-wider">
                 <i className="bi bi-mouse3"></i> Phụ kiện
               </div>
            </div>
          </div>

          <div className="flex text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
            <div className="w-1/2">Thông tin sản phẩm</div>
            <div className="w-1/6 text-center">Đã bán</div>
            <div className="w-1/6 text-right">Đơn giá</div>
            <div className="w-1/6 text-right">Tổng thu</div>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {stats?.topProducts?.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center p-3 rounded-2xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-100 group">
                <div className="w-1/2 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-2 flex-shrink-0 shadow-sm group-hover:border-blue-200 transition-colors">
                    <img 
                      src={getMediaUrl(p.image, '/images/default.png')}
                      alt="" 
                      className="w-full h-full object-contain" 
                      onError={(e: any) => { e.currentTarget.src = 'https://img.icons8.com/color/48/000000/keyboard.png'; }} 
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 line-clamp-1 text-sm group-hover:text-blue-600 transition-colors">{p.product_name}</p>
                  </div>
                </div>
                <div className="w-1/6 text-center font-bold text-gray-700 bg-gray-50 py-1 rounded-lg text-sm">x{p.sold}</div>
                <div className="w-1/6 text-right font-semibold text-gray-600 text-sm">{formatCurrency(p.price || (p.revenue / p.sold))}</div>
                <div className="w-1/6 text-right font-extrabold text-gray-900 text-base">{formatCurrency(p.revenue)}</div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <i className="bi bi-box-seam text-4xl mb-2 opacity-20"></i>
                <p className="font-medium">Chưa có sản phẩm nào được bán</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 text-[18px]">Đơn đặt hàng mới nhất</h3>
          <button onClick={() => router.push('/admin/orders')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
            Xem tất cả <i className="bi bi-arrow-right"></i>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="pb-4">Mã đơn</th>
                <th className="pb-4 text-center">Ngày đặt</th>
                <th className="pb-4 text-center">Khách hàng</th>
                <th className="pb-4 text-center">Số điện thoại</th>
                <th className="pb-4 text-right">Tổng tiền</th>
                <th className="pb-4 text-center">Trạng thái</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentOrders?.slice(0, 5).map((order: any) => (
                <tr key={order.order_id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="py-4 font-bold text-gray-700">#{order.order_id}</td>
                  <td className="py-4 text-center text-gray-500 font-medium">{formatDate(order.oder_date)}</td>
                  <td className="py-4 text-center font-bold text-gray-800">{order.customer_name || '---'}</td>
                  <td className="py-4 text-center text-gray-500 font-medium">{order.phone || '---'}</td>
                  <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="py-4 text-center">{getStatusBadge(order.status)}</td>
                  <td className="py-4 text-right">
                    <button onClick={() => router.push(`/admin/orders?id=${order.order_id}`)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 opacity-0 group-hover:opacity-100">
                      <i className="bi bi-eye-fill"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">Chưa có đơn hàng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
