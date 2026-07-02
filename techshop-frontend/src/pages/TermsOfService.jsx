import { Link } from "react-router-dom";
import { FileText, ChevronRight } from "lucide-react";

const LAST_UPDATED = "01/07/2026";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Chấp nhận điều khoản",
    content: `Khi truy cập và sử dụng website TechShop (techshop.vn), bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng không sử dụng dịch vụ của chúng tôi.

TechShop có quyền cập nhật, sửa đổi các điều khoản này bất cứ lúc nào. Phiên bản mới nhất sẽ luôn được đăng tải tại đây với ngày cập nhật rõ ràng.`,
  },
  {
    id: "account",
    title: "2. Tài khoản người dùng",
    content: `2.1. Đăng ký tài khoản: Để sử dụng đầy đủ các tính năng, bạn cần tạo tài khoản bằng email hợp lệ và mật khẩu đủ mạnh (tối thiểu 6 ký tự). Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.

2.2. Thông tin chính xác: Bạn cam kết cung cấp thông tin trung thực, chính xác và cập nhật khi đăng ký và trong suốt quá trình sử dụng dịch vụ.

2.3. Bảo mật tài khoản: TechShop không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh do bạn không bảo vệ được thông tin đăng nhập. Hãy thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.

2.4. Tài khoản bị khoá: Chúng tôi có quyền tạm ngừng hoặc xoá tài khoản vi phạm điều khoản mà không cần thông báo trước.`,
  },
  {
    id: "purchasing",
    title: "3. Đặt hàng và thanh toán",
    content: `3.1. Xác nhận đơn hàng: Đơn hàng chỉ được coi là hợp lệ sau khi TechShop gửi email xác nhận. Chúng tôi có quyền từ chối hoặc huỷ đơn hàng trong các trường hợp sản phẩm hết hàng, thông tin sai lệch hoặc nghi ngờ gian lận.

3.2. Giá cả: Tất cả giá niêm yết trên website đã bao gồm VAT. Giá có thể thay đổi mà không cần báo trước nhưng không ảnh hưởng đến đơn hàng đã xác nhận.

3.3. Phương thức thanh toán: Chúng tôi chấp nhận thanh toán qua thẻ VISA/Mastercard, ví MoMo, chuyển khoản ngân hàng và tiền mặt khi nhận hàng (COD).

3.4. Bảo mật thanh toán: Mọi giao dịch thanh toán trực tuyến được mã hoá theo tiêu chuẩn SSL/TLS. TechShop không lưu trữ thông tin thẻ ngân hàng của bạn.`,
  },
  {
    id: "shipping",
    title: "4. Vận chuyển và giao hàng",
    content: `4.1. Thời gian giao hàng: Thông thường 1-3 ngày làm việc tại Hà Nội và TP. Hồ Chí Minh; 3-7 ngày với các tỉnh thành khác. Thời gian có thể thay đổi trong dịp lễ, Tết hoặc sự kiện đặc biệt.

4.2. Phí vận chuyển: Được tính dựa trên khu vực giao hàng và trọng lượng đơn hàng, hiển thị rõ trong bước thanh toán. Đơn hàng từ 500.000₫ được miễn phí giao hàng nội thành.

4.3. Kiểm tra khi nhận: Bạn có trách nhiệm kiểm tra hàng trước khi ký nhận. Nếu sản phẩm bị hỏng hóc trong quá trình vận chuyển, hãy từ chối nhận và liên hệ ngay với chúng tôi.`,
  },
  {
    id: "returns",
    title: "5. Đổi trả và hoàn tiền",
    content: `5.1. Điều kiện đổi trả: Sản phẩm được đổi trả trong vòng 30 ngày kể từ ngày nhận hàng nếu: còn nguyên hộp và phụ kiện đi kèm, chưa có dấu hiệu sử dụng, lỗi do nhà sản xuất hoặc vận chuyển.

5.2. Trường hợp không áp dụng: Sản phẩm đã được kích hoạt, đã qua sử dụng, bị hỏng do người dùng, hoặc không còn seal.

5.3. Quy trình: Liên hệ hotline 1800.6975 hoặc email support@techshop.vn để được hướng dẫn. Thời gian xử lý hoàn tiền từ 5-10 ngày làm việc tuỳ phương thức thanh toán.`,
  },
  {
    id: "warranty",
    title: "6. Bảo hành",
    content: `Tất cả sản phẩm bán tại TechShop đều có bảo hành chính hãng. Thời gian bảo hành từ 12-24 tháng tuỳ sản phẩm. Khách hàng có thể tra cứu thông tin bảo hành tại /warranty-lookup. 

TechShop cũng cung cấp dịch vụ bảo hành tại nhà với phí hỗ trợ kỹ thuật, áp dụng tại các khu vực nội thành Hà Nội và TP. Hồ Chí Minh.`,
  },
  {
    id: "ip",
    title: "7. Sở hữu trí tuệ",
    content: `Toàn bộ nội dung trên website TechShop bao gồm nhưng không giới hạn ở: thiết kế, logo, văn bản, hình ảnh, mã nguồn đều thuộc quyền sở hữu của TechShop và được bảo hộ bởi luật sở hữu trí tuệ Việt Nam.

Nghiêm cấm sao chép, phân phối, chỉnh sửa hoặc sử dụng cho mục đích thương mại bất kỳ nội dung nào mà không có sự cho phép bằng văn bản.`,
  },
  {
    id: "prohibited",
    title: "8. Hành vi bị cấm",
    content: `Khi sử dụng dịch vụ của TechShop, bạn cam kết không:
• Đăng tải, chia sẻ nội dung sai lệch, xúc phạm, phân biệt đối xử hoặc vi phạm pháp luật.
• Cố gắng xâm nhập, phá hoại hệ thống kỹ thuật.
• Sử dụng tài khoản của người khác mà không được phép.
• Thực hiện giao dịch giả mạo, gian lận.
• Thu thập dữ liệu người dùng tự động (crawling, scraping) mà không có sự đồng ý.`,
  },
  {
    id: "liability",
    title: "9. Giới hạn trách nhiệm",
    content: `TechShop không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên hay hậu quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ, bao gồm mất dữ liệu, lợi nhuận hoặc cơ hội kinh doanh.

Trách nhiệm tối đa của TechShop trong mọi trường hợp không vượt quá giá trị đơn hàng đang tranh chấp.`,
  },
  {
    id: "law",
    title: "10. Luật áp dụng",
    content: `Các Điều khoản này được điều chỉnh và giải thích theo pháp luật Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.`,
  },
  {
    id: "contact",
    title: "11. Liên hệ",
    content: `Nếu có bất kỳ câu hỏi nào về Điều khoản Dịch vụ này, vui lòng liên hệ:
• Email: legal@techshop.vn
• Hotline: 1800.6975 (miễn phí, 8:00–22:00 hàng ngày)
• Địa chỉ: 123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh`,
  },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#E30019] transition">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium">Điều khoản dịch vụ</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* Sidebar — Table of Contents */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#E30019]" />
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
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Điều khoản dịch vụ
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
                Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của TechShop.
                Việc tiếp tục sử dụng website đồng nghĩa với việc bạn chấp nhận các điều khoản này.
              </p>
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
                Tài liệu này có hiệu lực tại Việt Nam và tuân theo pháp luật Việt Nam.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/privacy-policy"
                  className="text-xs font-semibold text-[#E30019] hover:underline"
                >
                  Chính sách bảo mật →
                </Link>
                <Link
                  to="/register"
                  className="h-9 px-5 rounded-lg bg-[#E30019] hover:bg-[#B80014] text-white text-xs font-bold flex items-center transition"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
