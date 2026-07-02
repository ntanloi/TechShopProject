import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import userApi from "../api/userApi";
import OtpInput from "../components/OtpInput";
import {
  Mail, Lock, User, Phone, Eye, EyeOff, Zap,
  ArrowRight, ArrowLeft, Check,
  MailCheck, RefreshCw, ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

const PW_RULES = [
  { id: "len", label: "Ít nhất 6 ký tự", test: (v) => v.length >= 6 },
  { id: "num", label: "Có chứa chữ số",  test: (v) => /\d/.test(v) },
];

const OTP_SECONDS = 300;

export default function Register() {
  // ── Bước 1 state ────────────────────────────────────────────
  const [form, setForm]     = useState({ fullName: "", email: "", password: "", phone: "" });
  const [showPw, setShowPw] = useState(false);
  const [step1Loading, setStep1Loading] = useState(false);

  // ── Bước 2 state ────────────────────────────────────────────
  const [step, setStep]           = useState(1);
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMasked]  = useState("");
  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);

  const [countdown, setCountdown]     = useState(OTP_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const nav = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Đếm ngược
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(OTP_SECONDS);
    const id = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [step, tempToken]);

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ── BƯỚC 1: Validate + gửi OTP ──────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    setStep1Loading(true);
    try {
      const res = await userApi.otpSend({
        type:     "REGISTER",
        email:    form.email,
        password: form.password,
        fullName: form.fullName,
        phone:    form.phone,
      });
      const { tempToken: tok, maskedEmail: masked } = res.data;
      setTempToken(tok);
      setMasked(masked);
      setOtp("");
      setOtpError(false);
      setStep(2);
      toast.info(`Mã OTP đã gửi tới ${masked}`, { autoClose: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại!", { theme: "colored" });
    } finally {
      setStep1Loading(false);
    }
  };

  // ── BƯỚC 2: Xác thực OTP → tạo tài khoản ───────────────────
  const handleStep2 = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6 || step2Loading) return;
    setStep2Loading(true);
    setOtpError(false);
    try {
      const res = await userApi.otpVerify({ tempToken, code: otp });
      const { token, ...userData } = res.data;

      localStorage.setItem("token", token);
      const userRes = await userApi.getMe();
      const fu = userRes.data;

      login(token, {
        id:       fu.id       || userData.id,
        email:    fu.email    || userData.email,
        role:     fu.role     || userData.role,
        fullName: fu.fullName || userData.fullName,
        phone:    fu.phone    || form.phone,
        address:  fu.address  || userData.address,
      });

      toast.success("Đăng ký thành công! Chào mừng đến TechShop 🎉");
      nav("/");
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(err.response?.data?.message || "Mã OTP không đúng!", { theme: "colored" });
    } finally {
      setStep2Loading(false);
    }
  };

  // Tự submit khi đủ 6 số
  useEffect(() => {
    if (otp.length === 6 && step === 2) handleStep2();
  }, [otp]);

  // Gửi lại OTP
  const handleResend = useCallback(async () => {
    if (resendLoading || countdown > 0) return;
    setResendLoading(true);
    try {
      const res = await userApi.otpSend({
        type: "REGISTER", email: form.email, password: form.password,
        fullName: form.fullName, phone: form.phone,
      });
      setTempToken(res.data.tempToken);
      setOtp("");
      setOtpError(false);
      toast.info("Đã gửi lại mã OTP mới!", { autoClose: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi lại OTP!", { theme: "colored" });
    } finally {
      setResendLoading(false);
    }
  }, [resendLoading, countdown, form]);

  const textFields = [
    { name: "fullName", label: "Họ và tên",    icon: User,  type: "text",  placeholder: "Nguyễn Văn A",    autoComplete: "name",  required: true  },
    { name: "email",    label: "Email",          icon: Mail,  type: "email", placeholder: "you@example.com",  autoComplete: "email", required: true  },
    { name: "phone",    label: "Số điện thoại", icon: Phone, type: "tel",   placeholder: "0901 234 567",     autoComplete: "tel",   required: false },
  ];

  return (
    <div className="min-h-screen flex bg-[#F2F2F2]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[46%] relative overflow-hidden bg-[#E30019] flex-col justify-between p-12 xl:p-16">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute -top-20 -right-20 w-[320px] h-[320px] rounded-full bg-black/15 blur-[70px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg shadow-black/20">
            <Zap className="w-6 h-6 text-[#E30019]" strokeWidth={2.5} />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">
            Tech<span className="text-[#FFE600]">Shop</span>
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-red-100 text-sm font-semibold tracking-[0.15em] uppercase">Tham gia ngay hôm nay</p>
            <h1 className="text-white text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight">
              Tài khoản miễn phí,<br />
              <span className="text-[#FFE600]">ưu đãi không giới hạn.</span>
            </h1>
            <p className="text-red-100 text-sm leading-relaxed max-w-[36ch]">
              Đăng ký để theo dõi đơn hàng, nhận thông báo khuyến mãi và trải nghiệm mua sắm cá nhân hóa.
            </p>
          </div>
          <ul className="space-y-3">
            {["Theo dõi đơn hàng real-time", "Ưu đãi thành viên độc quyền", "Lịch sử mua hàng & tái đặt dễ dàng"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white text-sm">{item}</span>
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

          {/* ══════════════ BƯỚC 1: Form đăng ký ══════════════ */}
          {step === 1 && (
            <div className="space-y-7">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#E30019] flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span className="text-xs font-semibold text-[#E30019]">Thông tin</span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">2</div>
                  <span className="text-xs font-medium text-gray-400">Xác thực</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Tạo tài khoản mới</h2>
                <p className="text-gray-500 text-sm">Đăng ký để bắt đầu mua sắm tại TechShop</p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                {textFields.map(({ name, label, icon: Icon, type, placeholder, autoComplete, required: req }) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-gray-700 text-sm font-semibold">
                      {label}
                      {!req && <span className="text-gray-400 font-normal ml-1">(tuỳ chọn)</span>}
                    </label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                      <input
                        type={type} name={name} required={req}
                        value={form[name]} onChange={handleChange}
                        placeholder={placeholder} autoComplete={autoComplete}
                        disabled={step1Loading}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type={showPw ? "text" : "password"} name="password" required
                      value={form.password} onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự" autoComplete="new-password"
                      disabled={step1Loading}
                      className="w-full h-11 pl-10 pr-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.8} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.8} />}
                    </button>
                  </div>

                  {/* Strength hints */}
                  {form.password.length > 0 && (
                    <ul className="flex gap-4 pt-1">
                      {PW_RULES.map((rule) => {
                        const ok = rule.test(form.password);
                        return (
                          <li key={rule.id} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-green-600" : "text-gray-400"}`}>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${ok ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                              {ok && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                            </div>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <button
                  type="submit" disabled={step1Loading}
                  className="w-full h-11 mt-1 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {step1Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><span>Tiếp tục</span><ArrowRight className="w-4 h-4" strokeWidth={2} /></>
                  }
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs">Đã có tài khoản?</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border-2 border-gray-200 bg-white hover:border-[#E30019] hover:text-[#E30019] text-gray-700 text-sm font-bold transition active:scale-[0.98]"
              >
                Đăng nhập ngay <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>

              <p className="text-center text-xs text-gray-400 leading-relaxed">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link to="/terms-of-service" target="_blank" className="text-gray-600 underline underline-offset-2 hover:text-[#E30019] transition">Điều khoản dịch vụ</Link>
                {" "}và{" "}
                <Link to="/privacy-policy" target="_blank" className="text-gray-600 underline underline-offset-2 hover:text-[#E30019] transition">Chính sách bảo mật</Link>.
              </p>
            </div>
          )}

          {/* ══════════════ BƯỚC 2: OTP ══════════════ */}
          {step === 2 && (
            <div className="space-y-8">

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-semibold text-green-600">Thông tin</span>
                </div>
                <div className="flex-1 h-px bg-[#E30019]" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#E30019] flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span className="text-xs font-semibold text-[#E30019]">Xác thực</span>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border-2 border-[#E30019]/20 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-[#E30019]" strokeWidth={1.8} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Xác thực email</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Mã xác thực 6 số đã gửi tới<br />
                    <span className="font-semibold text-gray-700">{maskedEmail}</span>
                  </p>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  countdown > 60  ? "bg-green-50 text-green-700 border border-green-200"
                  : countdown > 0 ? "bg-orange-50 text-orange-600 border border-orange-200"
                  :                 "bg-red-50 text-[#E30019] border border-red-200"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {countdown > 0 ? `Hết hạn sau ${formatCountdown(countdown)}` : "Mã đã hết hạn"}
                </div>
              </div>

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
                    : <><ShieldCheck className="w-4 h-4" strokeWidth={2} /><span>Hoàn tất đăng ký</span></>
                  }
                </button>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span className="text-gray-400">Không nhận được?</span>
                  <button
                    type="button" onClick={handleResend}
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
                  Quay lại và sửa thông tin
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
