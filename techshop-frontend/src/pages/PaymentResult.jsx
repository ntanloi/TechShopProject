import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import axios from "axios";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, failed
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy tất cả params từ VNPay callback
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        console.log("VNPay callback params:", params);

        // Gọi backend để verify payment
        const response = await axios.get("http://localhost:8085/payments/vnpay/callback", {
          params: params
        });

        console.log("Payment verification response:", response.data);

        if (response.data.success) {
          // Thanh toán thành công
          setStatus("success");
          setMessage(response.data.message || "Thanh toán thành công!");
          
          // Lấy orderId từ response (đây là order ID thật, không phải transaction ID)
          const orderId = response.data.orderId;
          
          console.log("Order ID from response:", orderId);
          
          // Chuyển đến order detail sau 2 giây với force refresh
          setTimeout(() => {
            if (orderId && orderId !== "0") {
              // Thêm timestamp để force refresh trang
              nav(`/orders/${orderId}?refresh=${Date.now()}`);
            } else {
              nav("/orders");
            }
          }, 2000);
        } else {
          // Thanh toán thất bại
          setStatus("failed");
          setMessage(response.data.message || "Thanh toán thất bại");
          
          // Chuyển về orders sau 5 giây
          setTimeout(() => {
            nav("/orders");
          }, 5000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("failed");
        setMessage("Có lỗi xảy ra khi xác thực thanh toán");
        
        setTimeout(() => {
          nav("/orders");
        }, 5000);
      }
    };

    verifyPayment();
  }, [searchParams, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "processing" && (
          <>
            <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý thanh toán...
            </h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công! 🎉
            </h1>
            <p className="text-gray-600 mb-4">
              {message || "Đơn hàng của bạn đã được thanh toán thành công."}
            </p>
            <p className="text-sm text-gray-500">
              Đang chuyển đến chi tiết đơn hàng...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-4">
              {message || "Đã có lỗi xảy ra trong quá trình thanh toán."}
            </p>
            <button
              onClick={() => nav("/orders")}
              className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
            >
              Quay lại đơn hàng
            </button>
          </>
        )}
      </div>
    </div>
  );
}
