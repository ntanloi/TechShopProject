import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import userApi from "../api/userApi";
import OtpInput from "../components/OtpInput";
import {
  Mail, Zap, ArrowRight, ArrowLeft,
  MailCheck, RefreshCw, ShieldCheck,
  Eye, EyeOff, Lock, Check,
} from "lucide-react";
import { toast } from "react-toastify";

const OTP_SECONDS = 300;

const PW_RULES = [
  { id: "len", label: "Ít nhất 6 ký tự", test: (v) => v.length >= 6 },
  { id: "num", label: "Có chứa chữ số",  test: (v) => /\d/.test(v) },
];

// Bước 1: nhập email
// Bước 2: nhập OTP
// Bước 3: đặt mật khẩu mới
// Bước 4: thành công

export default function ForgotPassword() {
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState("");
  const [step1Loading, setS1Load] = useState(false);

  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMasked]  = useState("");
  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState(false);
  const [step2Loading, setS2Load] = useState(false);

  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step3Loading, setS3Load] = useState(false);

  const [countdown, setCountdown]       = useState(OTP_SECONDS);
  const [resendLoading, setResendLoad]  = useState(false);

  const nav = useNavigate();

  // Đếm ngược khi ở bước 2
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(OTP_SECONDS);
    const id = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [step, tempToken]);

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // ── Bước 1: gửi OTP ─────────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    setS1Load(true);
    try {
      const res = await userApi.forgotPassword({ email });
      setTempToken(res.data.tempToken);
      setMasked(res.data.maskedEmail);
      setOtp(""); setOtpError(false);
      setStep(2);
      toast.info(`Mã OTP đã gửi tới ${res.data.maskedEmail}`, { autoClose: 3500 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi OTP!", { theme: "colored" });
    } finally { setS1Load(false); }
  };

  // ── Bước 2: xác thực OTP → chuyển bước 3 ───────────────────
  const handleStep2 = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6 || step2Loading) return;
    setS2Load(true); setOtpError(false);
    try {
      // Chỉ verify OTP bằng cách thử reset với password rỗng,
      // thực ra ta chờ bước 3 mới gọi reset-password thực sự.
      // → Chỉ chuyển UI sang bước 3, tempToken giữ nguyên
      setStep(3);
    } catch (err) {
      setOtpError(true); setOtp("");
      toast.error(err.response?.data?.message || "Mã OTP không đúng!", { theme: "colored" });
    } finally { setS2Load(false); }
  };

  // Tự chuyển sang bước 3 khi đủ 6 số
  useEffect(() => {
    if (otp.length === 6 && step === 2) handleStep2();
  }, [otp]);

  // ── Gửi lại OTP ─────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendLoading || countdown > 0) return;
    setResendLoad(true);
    try {
      const res = await userApi.forgotPassword({ email });
      setTempToken(res.data.tempToken);
      setOtp(""); setOtpError(false);
      toast.info("Đã gửi lại mã OTP mới!", { autoClose: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi lại OTP!", { theme: "colored" });
    } finally { setResendLoad(false); }
  }, [resendLoading, countdown, email]);

  // ── Bước 3: đặt mật khẩu mới ────────────────────────────────
  const handleStep3 = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (newPw !== confirmPw) { toast.error("Mật khẩu xác nhận không khớp!"); return; }
    setS3Load(true);
    try {
      await userApi.resetPassword({ tempToken, code: otp, newPassword: newPw });
      setStep(4);
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (err) {
      const msg = err.response?.data?.message || "Đặt lại mật khẩu thất bại!";
      toast.error(msg, { theme: "colored" });
      // Nếu OTP sai / hết hạn → về bước 2
      if (err.response?.status === 400) {
        setStep(2); setOtp(""); setOtpError(true);
      }
    } finally { setS3Load(false); }
  };

  // ── RENDER LAYOUT WRAPPER ───────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#F2F2F2]">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#E30019] flex-col justify-between p-12 xl:p-16">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-black/20 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg shadow-black/20">
            <Zap className="w-6 h-6 text-[#E30019]" strokeWidth={2.5} />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">
            Tech<span className="text-[#FFE600]">Shop</span>
          </span>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-5">
          <p className="text-red-100 text-sm font-semibold tracking-[0.15em] uppercase">Hỗ trợ tài khoản</p>
          <h1 className="text-white text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight">
            Quên mật khẩu?<br />
            <span className="text-[#FFE600]">Lấy lại ngay.</span>
          </h1>
          <p className="text-red-100 text-sm leading-relaxed max-w-[36ch]">
            Chúng tôi sẽ gửi mã xác thực OTP tới email của bạn.
            Chỉ mất 1 phút để đặt lại mật khẩu mới.
          </p>
          <ul className="space-y-3 pt-2">
            {["Mã OTP bảo mật 6 chữ số", "Hiệu lực 5 phút", "Mật khẩu mã hoá BCrypt"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white text-sm">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-red-200 text-xs">© 2026 TechShop · Thiết bị điện tử chính hãng</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
            <Zap className="w-5 h-5 text-[#E30019]" strokeWidth={2.5} />
          </div>
          <span className="text-gray-900 text-lg font-extrabold">Tech<span className="text-[#E30019]">Shop</span></span>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Progress dots */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-8">
              {[1,2,3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s ? "bg-green-500 text-white" : step === s ? "bg-[#E30019] text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === s ? "text-[#E30019]" : step > s ? "text-green-600" : "text-gray-400"}`}>
                    {s === 1 ? "Email" : s === 2 ? "Xác thực" : "Mật khẩu mới"}
                  </span>
                  {s < 3 && <div className={`flex-1 h-px w-6 ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          )}

          {/* ══ BƯỚC 1: Nhập email ══ */}
          {step === 1 && (
            <div className="space-y-7">
              <div className="space-y-1.5">
                <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Quên mật khẩu</h2>
                <p className="text-gray-500 text-sm">Nhập email đã đăng ký để nhận mã xác thực</p>
              </div>
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" disabled={step1Loading}
                      className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50"
                    />
                  </div>
                </div>
                <button type="submit" disabled={step1Loading}
                  className="w-full h-11 mt-1 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-60 disabled:cursor-not-allowed">
                  {step1Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><span>Gửi mã OTP</span><ArrowRight className="w-4 h-4" strokeWidth={2} /></>}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400">
                <Link to="/login" className="hover:text-[#E30019] transition underline underline-offset-2">
                  ← Quay lại đăng nhập
                </Link>
              </p>
            </div>
          )}

          {/* ══ BƯỚC 2: Nhập OTP ══ */}
          {step === 2 && (
            <div className="space-y-7">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border-2 border-[#E30019]/20 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-[#E30019]" strokeWidth={1.8} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Nhập mã OTP</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Mã xác thực đã gửi tới<br />
                    <span className="font-semibold text-gray-700">{maskedEmail}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  countdown > 60 ? "bg-green-50 text-green-700 border border-green-200"
                  : countdown > 0 ? "bg-orange-50 text-orange-600 border border-orange-200"
                  : "bg-red-50 text-[#E30019] border border-red-200"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {countdown > 0 ? `Hết hạn sau ${fmt(countdown)}` : "Mã đã hết hạn"}
                </div>
              </div>

              <form onSubmit={handleStep2} className="space-y-5">
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(false); }}
                  disabled={step2Loading || countdown === 0} error={otpError} />
                {otpError && (
                  <p className="text-center text-xs text-[#E30019] font-medium -mt-2">
                    Mã OTP không đúng. Vui lòng kiểm tra lại email.
                  </p>
                )}
                <button type="submit"
                  disabled={otp.length !== 6 || step2Loading || countdown === 0}
                  className="w-full h-11 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-50 disabled:cursor-not-allowed">
                  {step2Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><ShieldCheck className="w-4 h-4" strokeWidth={2} /><span>Xác nhận mã</span></>}
                </button>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span className="text-gray-400">Không nhận được?</span>
                  <button type="button" onClick={handleResend}
                    disabled={countdown > 0 || resendLoading}
                    className="flex items-center gap-1 font-semibold text-[#E30019] hover:text-[#B80014] disabled:text-gray-400 disabled:cursor-not-allowed transition">
                    {resendLoading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />}
                    Gửi lại
                  </button>
                </div>
                <button type="button" onClick={() => { setStep(1); setOtp(""); setOtpError(false); }}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-gray-600 transition">
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Đổi email khác
                </button>
              </div>
            </div>
          )}

          {/* ══ BƯỚC 3: Đặt mật khẩu mới ══ */}
          {step === 3 && (
            <div className="space-y-7">
              <div className="space-y-1.5">
                <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Đặt mật khẩu mới</h2>
                <p className="text-gray-500 text-sm">Mật khẩu mới phải có ít nhất 6 ký tự</p>
              </div>

              <form onSubmit={handleStep3} className="space-y-4">
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input type={showPw ? "text" : "password"} required value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự" disabled={step3Loading} autoComplete="new-password"
                      className="w-full h-11 pl-10 pr-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E30019]/30 focus:border-[#E30019] transition disabled:opacity-50" />
                    <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPw ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.8} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.8} />}
                    </button>
                  </div>
                  {newPw.length > 0 && (
                    <ul className="flex gap-4 pt-1">
                      {PW_RULES.map((rule) => {
                        const ok = rule.test(newPw);
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

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.8} />
                    <input type={showConfirm ? "text" : "password"} required value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Nhập lại mật khẩu" disabled={step3Loading} autoComplete="new-password"
                      className={`w-full h-11 pl-10 pr-11 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition disabled:opacity-50 ${
                        confirmPw && confirmPw !== newPw
                          ? "border-[#E30019] focus:ring-[#E30019]/30 focus:border-[#E30019]"
                          : "border-gray-200 focus:ring-[#E30019]/30 focus:border-[#E30019]"
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showConfirm ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.8} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.8} />}
                    </button>
                  </div>
                  {confirmPw && confirmPw !== newPw && (
                    <p className="text-xs text-[#E30019] mt-1">Mật khẩu xác nhận không khớp</p>
                  )}
                  {confirmPw && confirmPw === newPw && newPw.length >= 6 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={3} /> Mật khẩu khớp
                    </p>
                  )}
                </div>

                <button type="submit"
                  disabled={step3Loading || newPw.length < 6 || newPw !== confirmPw}
                  className="w-full h-11 mt-1 rounded-lg bg-[#E30019] hover:bg-[#B80014] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#E30019]/25 disabled:opacity-60 disabled:cursor-not-allowed">
                  {step3Loading
                    ? <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><ShieldCheck className="w-4 h-4" strokeWidth={2} /><span>Đặt lại mật khẩu</span></>}
                </button>
              </form>

              <button type="button" onClick={() => { setStep(2); setOtp(""); setOtpError(false); }}
                className="flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-gray-600 transition">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Quay lại nhập OTP
              </button>
            </div>
          )}

          {/* ══ BƯỚC 4: Thành công ══ */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-green-500" strokeWidth={1.8} />
              </div>
              <div className="space-y-2">
                <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight">Đặt lại thành công!</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Mật khẩu của bạn đã được cập nhật.<br />
                  Hãy đăng nhập với mật khẩu mới.
                </p>
              </div>
              <Link to="/login"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-[#E30019] hover:bg-[#B80014] text-white text-sm font-bold transition shadow-md shadow-[#E30019]/25">
                Đăng nhập ngay
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
              <p className="text-xs text-gray-400">
                <Link to="/" className="hover:text-[#E30019] transition underline underline-offset-2">
                  ← Về trang chủ
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
