import React from 'react';
import { Link } from 'react-router-dom';
import BlogNav from '../components/blog/BlogNav';
import SeoHead from '../components/common/SeoHead';
import { ShieldCheck, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyScreen() {
  return (
    <div className="min-h-screen bg-bg text-main transition-colors flex flex-col">
      <SeoHead
        title="Chính Sách Bảo Mật | ChongZi Tiếng Trung"
        description="Chính sách bảo mật thông tin người dùng của ứng dụng ChongZi Tiếng Trung. Cam kết bảo vệ dữ liệu cá nhân, tiến độ học tập và bảo mật tài khoản."
        keywords={['chính sách bảo mật', 'privacy policy', 'bảo mật chongzi']}
        canonicalUrl="https://chongziapp.id.vn/privacy"
        ogType="website"
      />

      <BlogNav />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-main transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về trang chủ</span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <ShieldCheck className="h-4 w-4" />
            <span>Cam kết minh bạch dữ liệu</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-main mb-2">
            Chính Sách Bảo Mật Thông Tin
          </h1>
          <p className="text-sm text-mute">
            Cập nhật lần cuối: Ngày 10 tháng 03 năm 2026 | Áp dụng cho toàn bộ nền tảng ChongZi (chongziapp.id.vn)
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base text-main/90 leading-relaxed">
          {/* Section 1 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span>1. Giới thiệu và Cam kết</span>
            </h2>
            <p className="mb-3">
              Chào mừng bạn đến với <strong>ChongZi Tiếng Trung</strong> (sau đây gọi là "ChongZi", "chúng tôi"). Chúng tôi hiểu rằng quyền riêng tư và sự an toàn của dữ liệu cá nhân là yếu tố quan trọng hàng đầu đối với người học.
            </p>
            <p>
              Chính sách này giải thích rõ ràng cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi bạn truy cập website hoặc sử dụng ứng dụng web tiến bộ (PWA) của ChongZi.
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span>2. Thông tin chúng tôi thu thập</span>
            </h2>
            <p className="mb-3">Chúng tôi chỉ thu thập những thông tin thực sự cần thiết nhằm phục vụ trải nghiệm học tập của bạn:</p>
            <ul className="list-disc pl-5 space-y-2 text-mute">
              <li><strong>Thông tin tài khoản:</strong> Địa chỉ email và tên hiển thị khi bạn đăng ký tài khoản để đồng bộ dữ liệu giữa các thiết bị. Mật khẩu được mã hóa an toàn một chiều (hashing bằng bcrypt), chúng tôi không thể đọc mật khẩu gốc của bạn.</li>
              <li><strong>Dữ liệu học tập & tiến độ:</strong> Lịch sử lật thẻ flashcard, khoảng cách ghi nhớ theo thuật toán FSRS-4.5, chuỗi ngày học liên tục (streak), điểm kinh nghiệm (XP) và kết quả làm đề thi HSK.</li>
              <li><strong>Dữ liệu cục bộ (Offline):</strong> Khi sử dụng chế độ offline, dữ liệu được lưu trữ trên trình duyệt của bạn qua công nghệ IndexedDB và LocalStorage, không tự động gửi lên máy chủ khi chưa có sự cho phép.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>3. Mục đích sử dụng dữ liệu</span>
            </h2>
            <p className="mb-3">Dữ liệu của bạn chỉ được sử dụng cho các mục đích hợp pháp sau:</p>
            <ul className="list-disc pl-5 space-y-2 text-mute">
              <li>Tính toán thời điểm lặp lại ngắt quãng tối ưu của từng từ vựng theo thuật toán FSRS, giúp bạn ghi nhớ từ hiệu quả nhất.</li>
              <li>Lưu lại lịch sử làm bài thi thử HSK để bạn xem lại giải thích chi tiết và phân tích các câu làm sai.</li>
              <li>Hiển thị thứ hạng thi đua học tập trên Bảng xếp hạng tuần (nếu bạn bật chế độ công khai tên hiển thị).</li>
              <li>Duy trì trạng thái đăng nhập bảo mật thông qua công nghệ mã hóa JSON Web Token (JWT).</li>
            </ul>
            <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-medium">
              ChongZi cam kết tuyệt đối: Chúng tôi <strong>KHÔNG</strong> bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba hay mạng lưới quảng cáo thương mại nào.
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>4. Quyền kiểm soát dữ liệu của người dùng</span>
            </h2>
            <p className="mb-3">Bạn có toàn quyền kiểm soát dữ liệu học tập của mình:</p>
            <ul className="list-disc pl-5 space-y-2 text-mute">
              <li><strong>Quyền xem và chỉnh sửa:</strong> Bạn có thể cập nhật tên hiển thị, mật khẩu và tùy chọn học tập bất cứ lúc nào trong mục Cài đặt.</li>
              <li><strong>Quyền xóa tài khoản:</strong> Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ lịch sử học tập khỏi cơ sở dữ liệu của chúng tôi bất cứ lúc nào bằng cách gửi yêu cầu về email hỗ trợ.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>5. Liên hệ với chúng tôi</span>
            </h2>
            <p className="mb-3">
              Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc khiếu nại nào liên quan đến Chính sách bảo mật hoặc việc xử lý dữ liệu của ChongZi, vui lòng liên hệ với chúng tôi qua:
            </p>
            <div className="p-3.5 rounded-lg bg-surface-hover border border-border text-xs sm:text-sm space-y-1">
              <div><strong>Đội ngũ phát triển ChongZi Tiếng Trung</strong></div>
              <div>Email hỗ trợ: <a href="mailto:chongzichinese@gmail.com" className="text-primary font-medium hover:underline">chongzichinese@gmail.com</a></div>
              <div>Fanpage Facebook: <a href="https://www.facebook.com/profile.php?id=61594118917546" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">ChongZi Tiếng Trung</a></div>
              <div>Website: <a href="https://chongziapp.id.vn" className="text-primary font-medium hover:underline">https://chongziapp.id.vn</a></div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/80 py-6 px-4 sm:px-6 transition-colors">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mute">
          <div>© 2026 ChongZi (虫子). Bản quyền thuộc về đội ngũ phát triển ChongZi.</div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-main transition-colors">Điều khoản dịch vụ</Link>
            <Link to="/privacy" className="text-primary font-medium">Chính sách bảo mật</Link>
            <a href="https://www.facebook.com/profile.php?id=61594118917546" target="_blank" rel="noopener noreferrer" className="hover:text-main transition-colors">Fanpage Facebook</a>
            <Link to="/" className="hover:text-main transition-colors">Trang chủ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
