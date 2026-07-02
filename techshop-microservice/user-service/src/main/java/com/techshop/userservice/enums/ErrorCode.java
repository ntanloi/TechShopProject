package com.techshop.userservice.enums;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định.", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Không có quyền truy cập hoặc phiên làm việc hết hạn.", HttpStatus.UNAUTHORIZED),
    INVALID_KEY(1002, "Khóa cấu hình validation không hợp lệ.", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1003, "Email này đã được sử dụng!", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1004, "Sai email hoặc mật khẩu!", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED(1005, "Tài khoản đã bị khóa!", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND(1006, "Người dùng không tồn tại!", HttpStatus.NOT_FOUND),
    TOKEN_INVALID(1007, "Token không hợp lệ hoặc đã hết hạn!", HttpStatus.UNAUTHORIZED),
    MISSING_TOKEN(1008, "Thiếu token xác thực!", HttpStatus.UNAUTHORIZED)
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
