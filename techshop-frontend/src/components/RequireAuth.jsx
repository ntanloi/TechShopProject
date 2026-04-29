import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Đang load user từ token → chờ, không redirect
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Chưa đăng nhập → về login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Không đủ quyền → về trang chủ
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
