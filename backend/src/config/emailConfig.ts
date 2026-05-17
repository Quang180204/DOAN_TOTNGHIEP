import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const emailConfig = {
  emailID: 'quang180204@gmail.com',
  emailPassword: 'xhuwqeedbjyrasze',
  emailHost: 'smtp.gmail.com',
  emailName: "QUANG'S SHOP",
};

const transporter = nodemailer.createTransport({
  host: emailConfig.emailHost,
  port: 587,
  secure: false,
  auth: {
    user: emailConfig.emailID,
    pass: emailConfig.emailPassword,
  },
});

const readTemplate = (templateName: string, replacements: Record<string, string>): string => {
  const templatePath = path.join(__dirname, '../../EmailTemplate', `${templateName}.html`);
  let template = fs.readFileSync(templatePath, 'utf8');

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return template;
};

const newsletterBannerPath = path.join(__dirname, '../../../frontend/public/images/banner3.jpg');

export const sendResetPasswordEmail = async (email: string, resetLink: string): Promise<void> => {
  try {
    const htmlContent = readTemplate('ResetPassword', {
      'viewBag.Confirmlink': resetLink,
    });

    await transporter.sendMail({
      from: `"${emailConfig.emailName}" <${emailConfig.emailID}>`,
      to: email,
      subject: 'Cập nhật mật khẩu mới',
      html: htmlContent,
    });
  } catch (error) {
    console.error('Send reset password email error:', error);
    throw error;
  }
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderId: number,
  orderItems: string,
  orderPrice: string,
  orderDiscount: string,
  total: string
): Promise<void> => {
  try {
    const htmlContent = readTemplate('EmailOrders', {
      order_id: orderId.toString(),
      order_item: orderItems,
      order_price: orderPrice,
      order_discount: orderDiscount,
      total: total,
    });

    await transporter.sendMail({
      from: `"${emailConfig.emailName}" <${emailConfig.emailID}>`,
      to: email,
      subject: `Thông tin đơn hàng #${orderId}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Send order confirmation email error:', error);
    throw error;
  }
};

export const sendNewsletterSubscriptionEmail = async (email: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"${emailConfig.emailName}" <${emailConfig.emailID}>`,
      to: email,
      subject: 'Đăng ký nhận tin thành công',
      html: `
        <div style="max-width: 720px; margin: 0 auto; padding: 32px 24px; font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937; background: #f8fbff;">
          <div style="background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 18px 40px -24px rgba(37, 99, 235, 0.3);">
            <div style="padding: 28px 28px 12px;">
              <p style="margin: 0 0 16px; font-size: 16px;">Xin chào Quý khách,</p>
              <p style="margin: 0 0 16px;">🎉 Chúc mừng! Quý khách đã đăng ký nhận tin thành công tại <strong>Quang&apos;s Shop</strong>.</p>
              <p style="margin: 0 0 16px;">
                Email <strong>${email}</strong> đã được thêm vào danh sách nhận thông tin khuyến mãi, sản phẩm mới và các ưu đãi đặc biệt dành riêng cho khách hàng quan tâm đến laptop.
              </p>
              <p style="margin: 0 0 16px;">Từ bây giờ, Quý khách sẽ là một trong những người đầu tiên nhận được:</p>

              <div style="margin: 0 0 18px;">
                <p style="margin: 0 0 10px;"><strong>💻 Thông tin laptop mới nhất</strong><br />Các mẫu laptop học tập, văn phòng, đồ họa và gaming vừa về hàng.</p>
                <p style="margin: 0 0 10px;"><strong>🔥 Ưu đãi hấp dẫn mỗi tháng</strong><br />Giảm giá, quà tặng, voucher và các chương trình khuyến mãi giới hạn.</p>
                <p style="margin: 0 0 10px;"><strong>🎁 Gợi ý mua sắm thông minh</strong><br />Tư vấn chọn laptop phù hợp với nhu cầu, ngân sách và mục đích sử dụng.</p>
                <p style="margin: 0;"><strong>⚡ Thông báo sớm các deal hot</strong><br />Không bỏ lỡ những sản phẩm có giá tốt và số lượng giới hạn.</p>
              </div>

              <p style="margin: 0 0 16px;">
                Cảm ơn Quý khách đã tin tưởng và lựa chọn đồng hành cùng Quang&apos;s Shop.
                Chúng tôi rất mong được giúp Quý khách tìm được chiếc laptop phù hợp nhất.
              </p>

              <p style="margin: 0 0 8px;">Trân trọng,</p>
              <p style="margin: 0 0 8px; font-weight: 700;">Quang&apos;s Shop</p>
              <p style="margin: 0; color: #2563eb; font-weight: 600;">💻 Laptop chất lượng — Giá tốt — Tư vấn tận tâm.</p>
            </div>

            <div style="padding: 20px 28px 28px;">
              <img
                src="cid:newsletter-banner"
                alt="Quang's Shop banner"
                style="display: block; width: 100%; border-radius: 16px;"
              />
            </div>
          </div>
        </div>
      `,
      attachments: fs.existsSync(newsletterBannerPath)
        ? [
            {
              filename: 'banner3.jpg',
              path: newsletterBannerPath,
              cid: 'newsletter-banner',
            },
          ]
        : [],
    });
  } catch (error) {
    console.error('Send newsletter subscription email error:', error);
    throw error;
  }
};

export default {
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendNewsletterSubscriptionEmail,
};
