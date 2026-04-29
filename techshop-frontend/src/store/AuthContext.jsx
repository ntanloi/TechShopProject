import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const fullName = localStorage.getItem("fullName");
    const id = localStorage.getItem("userId");

    if (token && role) {
      // Khôi phục user từ localStorage, không cần gọi API
      setUser({ token, role, email, fullName, id: id ? Number(id) : null });
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    if (!token) return;
    // Set token vào localStorage TRƯỚC
    localStorage.setItem("token", token);
    if (userData?.role) localStorage.setItem("role", userData.role);
    if (userData?.email) localStorage.setItem("email", userData.email);
    if (userData?.fullName) localStorage.setItem("fullName", userData.fullName);
    if (userData?.id) localStorage.setItem("userId", String(userData.id));
    // Set vào state
    setUser({ token, ...userData });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userId");
    setUser(null);
  };

  const isAuthenticated = !!user?.token;
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated, isAdmin, isStaff, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
