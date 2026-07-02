import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import userApi from "../api/userApi";
import OtpInput from "../components/OtpInput";
import {
  Mail, Lock, Eye, EyeOff, Zap,
  ShieldCheck, Truck, RotateCcw,
  ArrowRight, ArrowLeft, MailCheck, RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

// ── Bước 1: form email + password ───────────────────────────────
// ── Bước 2: nhập OTP 6 số từ email ─────────────────────────────

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Hàng chính hãng 100%" },
  { icon: Truck,       label: "Giao hàng trong 24h" },
  { icon: RotateCcw,   label: "Đổi trả miễn phí 30 ngày" },
];

const OTP_SECONDS = 300; // 5 phút — phải khớp backend

export default function Login() {
  // ── Step 1 state ────────────────────────────────────────────
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step1Loading, setStep1Loading] = useState(false);

  // ── Step 2 state ────────────────────────────────────────────
  const [step, setStep]           = useState(1);           // 1 | 2
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMasked]  = useState("");
  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);

  // Đếm ngược hết hạn OTP
  const [countdown, setCountdown] = useState(OTP_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);

  const { login, user } = useAuth();
  const nav      = useNavigate();
  const location = useLocation();
  const from     = location.state?.from?.pathname || "/";

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN" || user.role === "STAFF") nav("/admin/dashboard", { replace: true });
    else nav(from === "/login" ? "/" : from, { replace: true });
  }, [user]);

  // Đếm ngược khi ở bước 2
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(OTP_SECONDS);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, tempToken]);

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── BƯỚC 1: Validate + gửi OTP ──────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    if (step1Loading) return;
    setStep1Loading(true);
    try {
      const res = await userApi.otpSend({ type: "LOGIN", email, password });
      const { tempToken: tok, maskedEmail: masked } = res.data;
      setTempToken(tok);
      setMasked(masked);
      setOtp("");
      setOtpError(false);
      setStep(2);
      toast.info(`Mã OTP đã gửi tới ${masked}`, { autoClose: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Email hoặc mật khẩu không đúng!", { theme: "colored" });
    } finally {
      setStep1Loading(false);
    }
  };

  // ── BƯỚC 2: Xác thực OTP ────────────────────────────────────
  const handleStep2 = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6 || step2Loading) return;
    setStep2Loading(true);
    setOtpError(false);
    try {
      const res = await userApi.otpVerify({ tempToken, code: otp });
      const { token, role, fullName, id } = res.data;

      localStorage.setItem("token", token);
      const userRes = await userApi.getMe();
      const fu = userRes.data;

      login(token, {
        id:       fu.id       || id,
        email:    fu.email    || email,
        role:     fu.role     || role,
        fullName: fu.fullName || fullName,
        phone:    fu.phone,
        address:  fu.address,
      });

      toast.success("Đăng nhập thành công!", { theme: "colored" });

      if (role === "ADMIN" || role === "STAFF") nav("/admin/dashboard", { replace: true });
      else nav(from === "/login" ? "/" : from, { replace: true });
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(err.response?.data?.message || "Mã OTP không đúng!", { theme: "colored" });
    } finally {
      setStep2Loading(false);
    }
  };

  // Tự submit khi nhập đủ 6 số
  useEffect(() => {
    if (otp.length === 6 && step === 2) handleStep2();
  }, [otp]);

  // ── Gửi lại OTP ─────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendLoading || countdown > 0) return;
    setResendLoading(true);
    try {
      const res = await userApi.otpSend({ type: "LOGIN", email, password });
      setTempToken(res.data.tempToken);
      setOtp("");
      setOtpError(false);
      toast.info("Đã gửi lại mã OTP mới!", { autoClose: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi lại OTP!", { theme: "colored" });
    } finally {
      setResendLoading(false);
    }
  }, [resendLoading, countdown, email, password]);

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#F2F2F2]">

      {/* ── Left panel — brand (desktop) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-[#E30019] flex-col justify-between p-12 xl:p-16">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-black/20 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg shadow-black/20">
            <Zap className="w-6 h-6 text-[#E30019]" strokeWidth={2.5} />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">
            Tech<span className="text-[#FFE600]">Shop</span>
          </span>
        </div>

        <div className="relative z-10 space-y-7">
          <div className="space-y-3">
            <p className="text-red-100 text-sm font-semibold tracking-[0.15em] uppercase">Thiết bị chính hãng</p>
            <h1 className="text-white text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Mua sắm thông minh,<br />
              <span className="text-[#FFE600]">giá tốt nhất.</span>
            </h1>
            <p className="text-red-100 text-base leading-relaxed max-w-[38ch]">
              Hàng nghìn sản phẩm điện tử chính hãng. Giao nhanh, bảo hành đầy đủ.
            </p>
          </div>
          <ul className="space-y-3.5">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-white text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-red-200 text-xs">© 2026 TechShop · Thiết bị điện tử chính hãng</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 py-12 sm:px-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
            <Zap className="w-5 h-5 text-[#E30019]" strokeWidth={2.5} />
          </div>
          <span className="text-gray-900 text-lg font-extrabold tracking-tight">
            Tech<span className="text-[#E30019]">Shop</span>
          </span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* ══════════════ BƯỚC 1: Form ══════════════ */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-1.5">
                <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Chào mừng trở lại</h2>
                <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục mua sắm</p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={step1Loading}
                      className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-700 text-sm font-semibold">Mật khẩu</label>
                    <Link to="/forgot-password" className="text-xs text-[#E30019] hover:text-[#B80014] font-medium transition">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type={showPw ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={step1Loading}
                      className="w-full h-11 pl-10 pr-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50"
                    />
                    <button
                      type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPw ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.8} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.8} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={step1Loading}
                  className="w-full h-11 mt-2 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {step1Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><span>Tiếp tục</span><ArrowRight className="w-4 h-4" strokeWidth={2} /></>
                  }
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs">Chưa có tài khoản?</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border-2 border-gray-200 bg-white hover:border-[#E30019] hover:text-[#E30019] text-gray-700 text-sm font-bold transition active:scale-[0.98]"
              >
                Tạo tài khoản miễn phí
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>

              <p className="text-center text-xs text-gray-400">
                <Link to="/" className="hover:text-[#E30019] transition underline underline-offset-2">
                  ← Quay về trang chủ
                </Link>
              </p>
            </div>
          )}

          {/* ══════════════ BƯỚC 2: OTP ══════════════ */}
          {step === 2 && (
            <div className="space-y-8">

              {/* Icon + tiêu đề */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border-2 border-[#E30019]/20 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-[#E30019]" strokeWidth={1.8} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Xác thực OTP</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Mã xác thực 6 số đã gửi tới<br />
                    <span className="font-semibold text-gray-700">{maskedEmail}</span>
                  </p>
                </div>
              </div>

              {/* Countdown ring */}
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  countdown > 60
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : countdown > 0
                    ? "bg-orange-50 text-orange-600 border border-orange-200"
                    : "bg-red-50 text-[#E30019] border border-red-200"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {countdown > 0 ? `Hết hạn sau ${formatCountdown(countdown)}` : "Mã đã hết hạn"}
                </div>
              </div>

              {/* 6 ô OTP */}
              <form onSubmit={handleStep2} className="space-y-6">
                <OtpInput
                  value={otp}
                  onChange={(v) => { setOtp(v); setOtpError(false); }}
                  disabled={step2Loading || countdown === 0}
                  error={otpError}
                />

                {otpError && (
                  <p className="text-center text-xs text-[#E30019] font-medium -mt-2">
                    Mã OTP không đúng. Vui lòng kiểm tra lại email.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || step2Loading || countdown === 0}
                  className="w-full h-11 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step2Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><ShieldCheck className="w-4 h-4" strokeWidth={2} /><span>Xác nhận</span></>
                  }
                </button>
              </form>

              {/* Resend + back */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span className="text-gray-400">Không nhận được?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || resendLoading}
                    className="flex items-center gap-1 font-semibold text-[#E30019] hover:text-[#B80014] disabled:text-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {resendLoading
                      ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />}
                    Gửi lại
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); setOtpError(false); }}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                  Quay lại và thay đổi email
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
