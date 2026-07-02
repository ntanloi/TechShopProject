package com.techshop.inventoryservice.enums;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định.", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Không có quyền truy cập hoặc phiên làm việc hết hạn.", HttpStatus.UNAUTHORIZED),
    INVALID_KEY(1002, "Khóa cấu hình validation không hợp lệ.", HttpStatus.BAD_REQUEST),
    INVENTORY_NOT_FOUND(5001, "Không tìm thấy thông tin tồn kho sản phẩm!", HttpStatus.NOT_FOUND),
    INSUFFICIENT_STOCK(5002, "Tồn kho không đủ đáp ứng!", HttpStatus.BAD_REQUEST),
    INVALID_ADJUSTMENT(5003, "Số lượng điều chỉnh kho không hợp lệ!", HttpStatus.BAD_REQUEST)
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
