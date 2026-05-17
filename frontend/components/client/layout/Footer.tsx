import Link from 'next/link';

const footerColumns = [
  {
    title: 'Thông tin',
    links: [
      { href: '/contact', label: 'Liên hệ' },
      { href: '/about', label: 'Về chúng tôi' },
      { href: '/blog', label: 'Tin tức' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/account/profile', label: 'Tài khoản của tôi' },
      { href: '/orders', label: 'Lịch sử mua hàng' },
      { href: '/account/address', label: 'Sổ địa chỉ' },
      { href: '/account/change-password', label: 'Đổi mật khẩu' },
    ],
  },
  {
    title: 'Danh mục',
    links: [
      { href: '/products/laptop', label: 'Laptop' },
      { href: '/products/accessories', label: 'Phụ kiện' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyan-100/80 bg-[#152132] text-white">
      <div className="container-custom py-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr,0.9fr,0.8fr,1.1fr]">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h5 className="text-lg font-semibold text-sky-400">{column.title}</h5>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-300 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h5 className="text-lg font-semibold text-sky-400">Thông tin về chúng tôi</h5>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Chúng tôi là một nhóm sáng tạo tập trung vào laptop và phụ kiện công nghệ với giao diện mua sắm rõ ràng,
              hiện đại và dễ dùng hơn.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p>12 Ngô Xuân Quảng, Gia Lâm, Hà Nội</p>
              <p>0986 951 018</p>
              <p>quang180204@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          Copyright © 2024{' '}
          <Link href="/" className="text-sky-400 hover:text-sky-300">
            Quang&apos;s Shop
          </Link>
          . All rights reserved.
        </div>
      </div>
    </footer>
  );
}
