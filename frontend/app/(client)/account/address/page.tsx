'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AccountSidebar from '@/components/client/account/Sidebar';
import { PencilIcon, TrashIcon, PlusIcon, MapPinIcon, HomeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface Address {
  account_address_id: number;
  accountUsername: string;
  accountPhoneNumber: string;
  content: string;
  isDefault: boolean;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
}

interface Province {
  province_id: number;
  province_name: string;
}

interface District {
  district_id: number;
  district_name: string;
  type: string;
}

interface Ward {
  ward_id: number;
  ward_name: string;
  type: string;
}

export default function AddressPage() {
  const router = useRouter();
  const didFetchRef = useRef(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    accountUsername: '',
    accountPhoneNumber: '',
    province_id: '',
    district_id: '',
    ward_id: '',
    content: '',
    isDefault: false
  });

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/account/login?return=/account/address');
      return;
    }
    fetchAddresses();
    fetchProvinces();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/address');
      if (res.data.success) {
        setAddresses(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await api.get('/location/provinces');
      if (res.data.success) {
        setProvinces(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải tỉnh thành:', error);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await api.get(`/location/districts/${provinceId}`);
      if (res.data.success) {
        setDistricts(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải quận huyện:', error);
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      const res = await api.get(`/location/wards/${districtId}`);
      if (res.data.success) {
        setWards(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải phường xã:', error);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = parseInt(e.target.value);
    setFormData({ ...formData, province_id: e.target.value, district_id: '', ward_id: '' });
    setDistricts([]);
    setWards([]);
    if (provinceId) fetchDistricts(provinceId);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);
    setFormData({ ...formData, district_id: e.target.value, ward_id: '' });
    setWards([]);
    if (districtId) fetchWards(districtId);
  };

  const handleSubmit = async () => {
    if (!formData.accountUsername || !formData.accountPhoneNumber || !formData.province_id || !formData.district_id || !formData.ward_id || !formData.content) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await api.put(`/address/update/${editingId}`, formData);
      } else {
        res = await api.post('/address/create', formData);
      }
      if (res.data.success) {
        toast.success(editingId ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
        setShowModal(false);
        setEditingId(null);
        setFormData({ accountUsername: '', accountPhoneNumber: '', province_id: '', district_id: '', ward_id: '', content: '', isDefault: false });
        fetchAddresses();
      }
    } catch (error) {
      toast.error(editingId ? 'Cập nhật thất bại' : 'Thêm địa chỉ thất bại');
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      const res = await api.put(`/address/set-default/${id}`);
      if (res.data.success) {
        toast.success('Đã đặt làm địa chỉ mặc định');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      const res = await api.delete(`/address/delete/${id}`);
      if (res.data.success) {
        toast.success('Xóa địa chỉ thành công');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Xóa địa chỉ thất bại');
    }
  };

  const openEditModal = (address: Address) => {
    setEditingId(address.account_address_id);
    setFormData({
      accountUsername: address.accountUsername || '',
      accountPhoneNumber: address.accountPhoneNumber || '',
      province_id: address.province_id?.toString() || '',
      district_id: address.district_id?.toString() || '',
      ward_id: address.ward_id?.toString() || '',
      content: address.content || '',
      isDefault: address.isDefault
    });
    if (address.province_id) fetchDistricts(address.province_id);
    if (address.district_id) fetchWards(address.district_id);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <span>/</span>
          <Link href="/account/profile" className="hover:text-blue-600 transition">Tài khoản</Link>
          <span>/</span>
          <span className="text-gray-700">Sổ địa chỉ</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Sổ địa chỉ</h1>
                    <p className="text-blue-100 text-sm mt-1">Quản lý địa chỉ giao hàng của bạn</p>
                  </div>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-7xl mb-4 animate-bounce">📍</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có địa chỉ nào</h2>
                  <p className="text-gray-500 mb-6">Thêm địa chỉ để dễ dàng nhận hàng hơn</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.account_address_id} className="border border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              {address.isDefault ? (
                                <HomeIcon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                              )}
                              <span className="font-semibold text-gray-800">{address.accountUsername}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-600">{address.accountPhoneNumber}</span>
                              {address.isDefault && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Mặc định</span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-1">{address.content}</p>
                            <p className="text-sm text-gray-400">
                              {[address.ward_name, address.district_name, address.province_name].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {!address.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(address.account_address_id)}
                                className="p-2 text-gray-400 hover:text-blue-500 transition"
                                title="Đặt làm mặc định"
                              >
                                <HomeIcon className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(address)}
                              className="p-2 text-gray-400 hover:text-yellow-500 transition"
                              title="Sửa"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteAddress(address.account_address_id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition"
                              title="Xóa"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                <input
                  type="text"
                  value={formData.accountUsername}
                  onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  value={formData.accountPhoneNumber}
                  onChange={(e) => setFormData({ ...formData, accountPhoneNumber: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
                <select
                  value={formData.province_id}
                  onChange={handleProvinceChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((p) => (
                    <option key={p.province_id} value={p.province_id}>{p.province_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
                <select
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={!formData.province_id}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-100"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.district_id} value={d.district_id}>{d.type} {d.district_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
                <select
                  value={formData.ward_id}
                  onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                  disabled={!formData.district_id}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-100"
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>{w.type} {w.ward_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể *</label>
                <input
                  type="text"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">
                Hủy
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition">
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
