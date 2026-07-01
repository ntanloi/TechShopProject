package com.techshop.productservice.enums;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định.", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Không có quyền truy cập hoặc phiên làm việc hết hạn.", HttpStatus.UNAUTHORIZED),
    INVALID_KEY(1002, "Khóa cấu hình validation không hợp lệ.", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(2001, "Không tìm thấy danh mục!", HttpStatus.NOT_FOUND),
    CATEGORY_EXISTED(2002, "Tên danh mục đã tồn tại!", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(2003, "Không tìm thấy sản phẩm!", HttpStatus.NOT_FOUND),
    SKU_EXISTED(2004, "Mã sản phẩm (SKU) đã tồn tại!", HttpStatus.BAD_REQUEST),
    REVIEW_NOT_FOUND(2005, "Không tìm thấy đánh giá!", HttpStatus.NOT_FOUND),
    FORBIDDEN_REVIEW_DELETE(2006, "Bạn không có quyền xóa đánh giá này!", HttpStatus.FORBIDDEN),
    INVALID_RATING(2007, "Rating phải từ 1 đến 5!", HttpStatus.BAD_REQUEST),
    CATEGORY_HAS_PRODUCTS(2008, "Không thể xóa danh mục đang có sản phẩm!", HttpStatus.BAD_REQUEST),
    INVALID_PRICE(2009, "Giá phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    INVALID_SALE_PRICE(2010, "Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc và lớn hơn 0", HttpStatus.BAD_REQUEST)
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
