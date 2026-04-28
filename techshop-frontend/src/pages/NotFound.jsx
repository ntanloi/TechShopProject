import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-extrabold text-orange-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Trang không tồn tại</h1>
        <p className="text-gray-500 mb-8">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/" className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-lg">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
