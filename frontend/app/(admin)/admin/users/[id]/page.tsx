// app/(admin)/admin/users/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getMediaUrl } from '@/lib/media';

interface Address {
  account_address_id: number;
  content: string;
  Wards?: { type: string; ward_name: string };
  Districts?: { type: string; district_name: string };
  Provinces?: { province_name: string };
}

interface AccountDetail {
  account_id: number;
  Name: string;
  email: string;
  Phone: string;
  Role: number;
  status: string;
  create_at: string;
  update_at: string;
  create_by: string;
  update_by: string;
  Avatar: string;
  addresses: Address[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await api.get(`/admin/auth/${params.id}`);
        if (res.data.success) {
          setAccount(res.data.data);
        } else {
          toast.error('Không tìm thấy tài khoản');
        }
      } catch (error) {
        toast.error('Không thể tải thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [params.id]);

  const formatDate = (date: string) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-10">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <>
      {/* Toolbar */}
      <div className="toolbar" id="kt_toolbar">
        <div className="container-fluid d-flex flex-stack">
          <div className="page-title d-flex align-items-center flex-wrap me-3 mb-5 mb-lg-0">
            <h1 className="d-flex align-items-center text-dark fw-bolder fs-3 my-1">Thông tin tài khoản</h1>
            <span className="h-20px border-gray-300 border-start mx-4"></span>
            <ul className="breadcrumb breadcrumb-separatorless fw-bold fs-7 my-1">
              <li className="breadcrumb-item text-muted">
                <a className="text-muted text-hover-primary">Tài khoản</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-300 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-dark">Thông tin tài khoản</li>
            </ul>
          </div>
          <div className="btn btn-sm btn-flex fw-bolder">
            <button onClick={() => router.back()} className="btn btn-sm btn-primary">
              <span className="svg-icon svg-icon-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect opacity="0.3" x="8.5" y="11" width="12" height="2" rx="1" fill="black" />
                  <path d="M10.3687 11.6927L12.1244 10.2297C12.5946 9.83785 12.6268 9.12683 12.194 8.69401C11.8043 8.3043 11.1784 8.28591 10.7664 8.65206L7.84084 11.2526C7.39332 11.6504 7.39332 12.3496 7.84084 12.7474L10.7664 15.3479C11.1784 15.7141 11.8043 15.6957 12.194 15.306C12.6268 14.8732 12.5946 14.1621 12.1244 13.7703L10.3687 12.3073C10.1768 12.1474 10.1768 11.8526 10.3687 11.6927Z" fill="black" />
                  <path opacity="0.5" d="M16 5V6C16 6.55228 15.5523 7 15 7C14.4477 7 14 6.55228 14 6C14 5.44772 13.5523 5 13 5H6C5.44771 5 5 5.44772 5 6V18C5 18.5523 5.44771 19 6 19H13C13.5523 19 14 18.5523 14 18C14 17.4477 14.4477 17 15 17C15.5523 17 16 17.4477 16 18V19C16 20.1046 15.1046 21 14 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H14C15.1046 3 16 3.89543 16 5Z" fill="black" />
                </svg>
              </span>
              Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* Navbar with avatar */}
      <div className="card mb-5 mb-xl-10">
        <div className="card-body pt-9 pb-0">
          <div className="d-flex flex-wrap flex-sm-nowrap mb-3">
            <div className="me-7 mb-4">
              <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                <img
                  src={getMediaUrl(account.Avatar, '/images/default.png')}
                  alt={account.Name}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  onError={(event) => {
                    event.currentTarget.src = '/images/default.png';
                  }}
                />
              </div>
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <a href="#" className="text-gray-900 text-hover-primary fs-2 fw-bolder me-1">{account.email}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details View */}
      <div className="card mb-5 mb-xl-10">
        <div className="card-body p-9">
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">ID</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.account_id}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Họ tên</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.Name || '---'}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Email</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.email || '---'}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Số điện thoại</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.Phone || '---'}</span>
            </div>
          </div>

          {/* Danh sách địa chỉ */}
          {account.addresses?.map((addr, idx) => (
            <div key={addr.account_address_id} className="row mb-7">
              <label className="col-lg-4 fw-bold text-muted">Địa chỉ {idx + 1}</label>
              <div className="col-lg-8">
                <span className="fw-bold fs-6 text-gray-800">
                  {addr.content}, {addr.Wards?.type} {addr.Wards?.ward_name}, {addr.Districts?.type} {addr.Districts?.district_name}, {addr.Provinces?.province_name}
                </span>
              </div>
            </div>
          ))}

          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Trạng thái</label>
            <div className="col-lg-8">
              <span className={`fw-bold fs-6 ${account.status === '1' ? 'text-success' : 'text-danger'}`}>
                {account.status === '1' ? 'Đang hoạt động' : 'Không hoạt động'}
              </span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Ngày tạo</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{formatDate(account.create_at)}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Ngày cập nhật</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{formatDate(account.update_at)}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Người tạo</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.create_by || 'Hệ thống'}</span>
            </div>
          </div>
          <div className="row mb-7">
            <label className="col-lg-4 fw-bold text-muted">Người cập nhật</label>
            <div className="col-lg-8">
              <span className="fw-bold fs-6 text-gray-800">{account.update_by || '---'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
