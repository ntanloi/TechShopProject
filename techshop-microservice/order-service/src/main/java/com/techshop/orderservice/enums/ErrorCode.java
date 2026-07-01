package com.techshop.orderservice.enums;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định.", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Không có quyền truy cập hoặc phiên làm việc hết hạn.", HttpStatus.UNAUTHORIZED),
    INVALID_KEY(1002, "Khóa cấu hình validation không hợp lệ.", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(3001, "Không tìm thấy đơn hàng!", HttpStatus.NOT_FOUND),
    INVALID_QUANTITY(3002, "Số lượng phải lớn hơn 0!", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_EXIST(3003, "Sản phẩm không tồn tại!", HttpStatus.NOT_FOUND),
    PRODUCT_CHECK_ERROR(3004, "Lỗi kiểm tra sản phẩm!", HttpStatus.INTERNAL_SERVER_ERROR),
    OUT_OF_STOCK(3005, "Sản phẩm không đủ số lượng trong kho!", HttpStatus.BAD_REQUEST),
    NO_STOCK_INFO(3006, "Sản phẩm chưa có thông tin tồn kho!", HttpStatus.BAD_REQUEST),
    STOCK_CHECK_ERROR(3007, "Lỗi kiểm tra tồn kho!", HttpStatus.INTERNAL_SERVER_ERROR),
    SERVICE_UNAVAILABLE(3008, "Dịch vụ kiểm tra kho hiện không khả dụng.", HttpStatus.SERVICE_UNAVAILABLE),
    CART_ITEM_NOT_FOUND(3009, "Không tìm thấy sản phẩm trong giỏ hàng!", HttpStatus.NOT_FOUND),
    CANCEL_NOT_ALLOWED(3010, "Chỉ có thể hủy đơn hàng ở trạng thái PENDING!", HttpStatus.BAD_REQUEST),
    FORBIDDEN_ORDER_ACCESS(3011, "Bạn không có quyền thao tác trên đơn hàng này!", HttpStatus.FORBIDDEN)
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
