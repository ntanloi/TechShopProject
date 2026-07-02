import { Link } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";

const LAST_UPDATED = "01/07/2026";

const SECTIONS = [
  {
    id: "intro",
    title: "1. Giới thiệu",
    content: `TechShop cam kết bảo vệ quyền riêng tư của bạn. Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi sử dụng website và dịch vụ của TechShop.

Chúng tôi tuân thủ đầy đủ các quy định về bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam và các văn bản pháp luật liên quan.`,
  },
  {
    id: "data-collected",
    title: "2. Thông tin chúng tôi thu thập",
    content: `2.1. Thông tin bạn cung cấp trực tiếp:
• Họ tên, địa chỉ email, số điện thoại khi đăng ký tài khoản.
• Địa chỉ giao hàng khi đặt mua sản phẩm.
• Thông tin thanh toán (chúng tôi không lưu trữ thông tin thẻ ngân hàng — dữ liệu này xử lý trực tiếp qua cổng thanh toán bảo mật).
• Nội dung phản hồi, đánh giá sản phẩm và yêu cầu hỗ trợ.

2.2. Thông tin thu thập tự động:
• Địa chỉ IP, loại trình duyệt, hệ điều hành, ngôn ngữ hiển thị.
• Trang bạn truy cập, thời gian, hành vi điều hướng trên website.
• Dữ liệu cookies và bộ nhớ cục bộ (localStorage).

2.3. Thông tin từ bên thứ ba:
• Nếu bạn đăng nhập qua mạng xã hội (Google, Facebook), chúng tôi nhận thông tin hồ sơ công khai theo sự cho phép của bạn.`,
  },
  {
    id: "data-use",
    title: "3. Mục đích sử dụng thông tin",
    content: `Chúng tôi sử dụng thông tin của bạn để:
• Xử lý và giao hàng đơn đặt hàng, cập nhật trạng thái đơn hàng.
• Xác minh danh tính và bảo mật tài khoản.
• Gửi email xác nhận đơn hàng, thông báo giao hàng và hoá đơn.
• Cung cấp hỗ trợ khách hàng và giải quyết khiếu nại.
• Gửi thông tin khuyến mãi, sản phẩm mới (chỉ khi bạn đồng ý nhận).
• Cải thiện trải nghiệm website và phát triển tính năng mới.
• Phân tích thống kê và nghiên cứu thị trường (dạng dữ liệu tổng hợp, ẩn danh).
• Tuân thủ các nghĩa vụ pháp lý.`,
  },
  {
    id: "cookies",
    title: "4. Cookies và công nghệ theo dõi",
    content: `4.1. Cookies bắt buộc: Cần thiết để website hoạt động đúng (xác thực phiên, giỏ hàng). Bạn không thể tắt nhóm này.

4.2. Cookies phân tích: Giúp chúng tôi hiểu cách người dùng tương tác với website (ví dụ: Google Analytics). Dữ liệu được ẩn danh hoá.

4.3. Cookies tiếp thị: Được dùng để hiển thị quảng cáo phù hợp. Bạn có thể từ chối tại cài đặt trình duyệt hoặc trang Tuỳ chọn Cookie.

4.4. localStorage: Chúng tôi lưu token xác thực và tuỳ chọn giao diện vào bộ nhớ cục bộ của trình duyệt để cải thiện trải nghiệm sử dụng.`,
  },
  {
    id: "sharing",
    title: "5. Chia sẻ thông tin với bên thứ ba",
    content: `TechShop không bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:

• Đối tác vận chuyển (GHN, Ninja Van): tên, địa chỉ, số điện thoại để giao hàng.
• Cổng thanh toán (MoMo, VNPAY): dữ liệu giao dịch tối thiểu cần thiết.
• Nhà cung cấp dịch vụ cloud và hosting để lưu trữ và vận hành hệ thống.
• Cơ quan nhà nước có thẩm quyền khi có yêu cầu pháp lý hợp lệ.
• Công ty con hoặc đối tác chiến lược trong cùng tập đoàn (nếu có), với ràng buộc bảo mật tương đương.

Mọi đối tác đều phải ký thoả thuận xử lý dữ liệu bảo mật trước khi tiếp cận thông tin của bạn.`,
  },
  {
    id: "security",
    title: "6. Bảo mật dữ liệu",
    content: `6.1. Mã hoá: Mọi kết nối tới website đều dùng HTTPS (TLS 1.3). Mật khẩu được mã hoá một chiều bằng BCrypt trước khi lưu vào cơ sở dữ liệu — ngay cả nhân viên TechShop cũng không thể xem mật khẩu của bạn.

6.2. Kiểm soát truy cập: Dữ liệu khách hàng chỉ được truy cập bởi nhân viên có thẩm quyền và ghi nhật ký đầy đủ.

6.3. Giám sát: Hệ thống được giám sát 24/7 để phát hiện truy cập bất thường.

6.4. Sự cố bảo mật: Nếu xảy ra vi phạm dữ liệu, chúng tôi sẽ thông báo cho bạn trong vòng 72 giờ và báo cáo cơ quan chức năng theo quy định pháp luật.`,
  },
  {
    id: "retention",
    title: "7. Lưu trữ và xoá dữ liệu",
    content: `• Dữ liệu tài khoản được lưu trong suốt thời gian tài khoản tồn tại.
• Dữ liệu đơn hàng và giao dịch được lưu tối thiểu 5 năm để tuân thủ nghĩa vụ kế toán và thuế.
• Dữ liệu nhật ký hệ thống (log) được lưu tối đa 90 ngày.
• Dữ liệu phân tích ẩn danh có thể lưu không giới hạn thời gian.

Khi xoá tài khoản, thông tin cá nhân sẽ bị xoá trong vòng 30 ngày, ngoại trừ dữ liệu cần thiết cho mục đích pháp lý.`,
  },
  {
    id: "rights",
    title: "8. Quyền của bạn",
    content: `Bạn có các quyền sau đối với dữ liệu cá nhân:

• Quyền truy cập: Yêu cầu xem toàn bộ dữ liệu chúng tôi đang lưu trữ về bạn.
• Quyền chỉnh sửa: Cập nhật thông tin không chính xác hoặc lỗi thời.
• Quyền xoá: Yêu cầu xoá tài khoản và dữ liệu cá nhân (trừ dữ liệu pháp lý bắt buộc).
• Quyền hạn chế xử lý: Yêu cầu chúng tôi tạm dừng xử lý dữ liệu trong một số trường hợp.
• Quyền phản đối: Từ chối nhận email marketing bất cứ lúc nào qua link huỷ đăng ký trong email.
• Quyền khiếu nại: Nếu không hài lòng, bạn có thể khiếu nại lên Bộ Thông tin và Truyền thông.

Để thực hiện các quyền trên, gửi yêu cầu đến privacy@techshop.vn.`,
  },
  {
    id: "children",
    title: "9. Trẻ em và người dưới 18 tuổi",
    content: `Dịch vụ của TechShop không hướng đến người dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ liệu cá nhân của trẻ em. Nếu bạn là phụ huynh và phát hiện con mình đã cung cấp thông tin, vui lòng liên hệ để chúng tôi xoá ngay.

Người từ 13-18 tuổi cần có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp.`,
  },
  {
    id: "updates",
    title: "10. Thay đổi chính sách",
    content: `Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Khi có thay đổi quan trọng, chúng tôi sẽ:
• Cập nhật ngày "Cập nhật lần cuối" tại đầu trang.
• Gửi email thông báo tới địa chỉ đăng ký của bạn.
• Hiển thị thông báo nổi bật trên website trong 30 ngày.

Việc tiếp tục sử dụng dịch vụ sau khi chính sách được cập nhật đồng nghĩa với việc bạn đồng ý với các thay đổi đó.`,
  },
  {
    id: "contact",
    title: "11. Liên hệ về bảo mật",
    content: `Nếu có bất kỳ câu hỏi, lo ngại hoặc yêu cầu liên quan đến quyền riêng tư, vui lòng liên hệ:

Bộ phận Bảo mật Dữ liệu — TechShop
• Email: privacy@techshop.vn
• Hotline: 1800.6975 (phím 3, 8:00–22:00)
• Địa chỉ: 123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh

Chúng tôi cam kết phản hồi trong vòng 5 ngày làm việc.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#E30019] transition">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium">Chính sách bảo mật</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* Sidebar — Table of Contents */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E30019]" />
                Mục lục
              </h3>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs text-gray-600 hover:text-[#E30019] hover:bg-red-50 rounded-lg px-3 py-2 transition"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-10">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#E30019] rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Chính sách bảo mật
                </h1>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Phiên bản: 2.0</span>
                <span>•</span>
                <span>Cập nhật lần cuối: {LAST_UPDATED}</span>
                <span>•</span>
                <span>Áp dụng từ: 01/01/2025</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                Tại TechShop, quyền riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi cam kết
                minh bạch về cách thu thập và sử dụng dữ liệu để bạn hoàn toàn an tâm mua sắm.
              </p>

              {/* Trust badges */}
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  "🔒 Mã hoá SSL/TLS",
                  "🛡️ BCrypt password",
                  "📋 Tuân thủ NĐ 13/2023",
                  "🚫 Không bán dữ liệu",
                ].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 text-xs bg-red-50 text-[#E30019] border border-red-100 rounded-full px-3 py-1 font-semibold"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="text-base font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block shrink-0" />
                    {s.title}
                  </h2>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-gray-100">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-xs text-gray-400">
                Tài liệu này tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/terms-of-service"
                  className="text-xs font-semibold text-[#E30019] hover:underline"
                >
                  Điều khoản dịch vụ →
                </Link>
                <a
                  href="mailto:privacy@techshop.vn"
                  className="h-9 px-5 rounded-lg bg-[#E30019] hover:bg-[#B80014] text-white text-xs font-bold flex items-center transition"
                >
                  Liên hệ bảo mật
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
