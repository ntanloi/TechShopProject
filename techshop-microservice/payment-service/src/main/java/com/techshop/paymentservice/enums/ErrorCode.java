package com.techshop.paymentservice.enums;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định.", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Không có quyền truy cập hoặc phiên làm việc hết hạn.", HttpStatus.UNAUTHORIZED),
    INVALID_KEY(1002, "Khóa cấu hình validation không hợp lệ.", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT(4001, "Số tiền thanh toán không hợp lệ!", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_FOUND(4002, "Không tìm thấy giao dịch thanh toán!", HttpStatus.NOT_FOUND),
    VNPAY_SIGNATURE_INVALID(4003, "Chữ ký VNPAY không hợp lệ!", HttpStatus.BAD_REQUEST)
    ;

    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatus getStatusCode() {
        return statusCode;
    }
}
