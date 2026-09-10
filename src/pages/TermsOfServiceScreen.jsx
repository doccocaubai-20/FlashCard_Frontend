import React from 'react';
import { Link } from 'react-router-dom';
import BlogNav from '../components/blog/BlogNav';
import SeoHead from '../components/common/SeoHead';
import { FileText, BookOpen, AlertCircle, CheckCircle2, Scale, Mail, ArrowLeft } from 'lucide-react';

export default function TermsOfServiceScreen() {
  return (
    <div className="min-h-screen bg-bg text-main transition-colors flex flex-col">
      <SeoHead
        title="Điều Khoản Dịch Vụ | ChongZi Tiếng Trung"
        description="Điều khoản dịch vụ và quy định sử dụng nền tảng tự học tiếng Trung ChongZi. Quyền lợi và nghĩa vụ của người học khi tham gia hệ thống."
        keywords={['điều khoản dịch vụ', 'terms of service', 'quy định sử dụng chongzi']}
        canonicalUrl="https://chongziapp.id.vn/terms"
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <FileText className="h-4 w-4" />
            <span>Quy định sử dụng dịch vụ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-main mb-2">
            Điều Khoản Dịch Vụ
          </h1>
          <p className="text-sm text-mute">
            Cập nhật lần cuối: Ngày 10 tháng 03 năm 2026 | Áp dụng cho mọi người dùng trên website và ứng dụng ChongZi
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base text-main/90 leading-relaxed">
          {/* Section 1 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>1. Chấp thuận điều khoản</span>
            </h2>
            <p className="mb-3">
              Bằng việc truy cập hoặc tạo tài khoản trên nền tảng <strong>ChongZi Tiếng Trung</strong> (chongziapp.id.vn), bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được nêu trong văn bản này.
            </p>
            <p>
              Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng ngừng sử dụng website và ứng dụng của chúng tôi.
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>2. Quyền sử dụng và Mục đích phi thương mại</span>
            </h2>
            <p className="mb-3">
              ChongZi là nền tảng công nghệ giáo dục được cung cấp <strong>hoàn toàn miễn phí</strong> nhằm hỗ trợ cộng đồng người tự học tiếng Trung tại Việt Nam.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-mute">
              <li>Bạn được quyền sử dụng toàn bộ tính năng: học thẻ Flashcard FSRS, tra cứu 214 bộ thủ, tập viết chữ Hán, thi thử 77 đề HSK, và chăm sóc Nông trại từ vựng cho mục đích học tập cá nhân.</li>
              <li>Nghiêm cấm mọi hành vi sao chép, trích xuất dữ liệu tự động (scraping), phân phối lại mã nguồn hoặc kinh doanh thương mại các tài nguyên từ hệ thống ChongZi mà không có sự đồng ý bằng văn bản của chúng tôi.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span>3. Trách nhiệm của người dùng</span>
            </h2>
            <p className="mb-3">Khi tham gia học tập trên hệ thống, bạn cam kết:</p>
            <ul className="list-disc pl-5 space-y-2 text-mute">
              <li>Cung cấp thông tin đăng ký chính xác và có trách nhiệm bảo mật mật khẩu tài khoản cá nhân.</li>
              <li>Không can thiệp trái phép, chỉnh sửa thông số điểm số, gian lận điểm kinh nghiệm (XP) hoặc làm sai lệch kết quả bảng xếp hạng thi đua.</li>
              <li>Không thực hiện các cuộc tấn công từ chối dịch vụ (DDoS), phát tán mã độc hoặc gây cản trở hoạt động bình thường của máy chủ.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span>4. Giới hạn trách nhiệm về đề thi thử HSK</span>
            </h2>
            <p className="mb-3">
              Các bộ đề thi thử HSK (Cấp độ 1 đến 6) trên ChongZi được xây dựng nhằm mục đích mô phỏng phòng thi máy thực tế để người học rèn luyện tốc độ làm bài và làm quen với cấu trúc đề.
            </p>
            <p className="text-mute">
              Kết quả thi thử trên ChongZi mang tính chất tham khảo học tập, không có giá trị thay thế cho các chứng chỉ năng lực Hán ngữ quốc tế do Trung tâm Hợp tác Giao lưu Ngôn ngữ (CLEC/CTI) chính thức cấp.
            </p>
          </section>

          {/* Section 5 */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg sm:text-xl font-bold text-main mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>5. Hỗ trợ và Giải quyết khiếu nại</span>
            </h2>
            <p className="mb-3">
              Mọi đóng góp ý kiến, phản hồi về nội dung bài học hoặc báo cáo lỗi kỹ thuật, xin vui lòng liên hệ với ban quản trị qua:
            </p>
            <div className="p-3.5 rounded-lg bg-surface-hover border border-border text-xs sm:text-sm space-y-1">
              <div><strong>Đội ngũ vận hành ChongZi Tiếng Trung</strong></div>
              <div>Email hỗ trợ: <a href="mailto:chongzichinese@gmail.com" className="text-primary font-medium hover:underline">chongzichinese@gmail.com</a></div>
              <div>Fanpage Facebook: <a href="https://www.facebook.com/profile.php?id=61594118917546" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">ChongZi Tiếng Trung</a></div>
              <div>Địa chỉ website: <a href="https://chongziapp.id.vn" className="text-primary font-medium hover:underline">https://chongziapp.id.vn</a></div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/80 py-6 px-4 sm:px-6 transition-colors">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mute">
          <div>© 2026 ChongZi (虫子). Bản quyền thuộc về đội ngũ phát triển ChongZi.</div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-primary font-medium">Điều khoản dịch vụ</Link>
            <Link to="/privacy" className="hover:text-main transition-colors">Chính sách bảo mật</Link>
            <a href="https://www.facebook.com/profile.php?id=61594118917546" target="_blank" rel="noopener noreferrer" className="hover:text-main transition-colors">Fanpage Facebook</a>
            <Link to="/" className="hover:text-main transition-colors">Trang chủ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
