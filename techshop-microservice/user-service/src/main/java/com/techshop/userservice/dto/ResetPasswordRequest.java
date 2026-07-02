package com.techshop.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Bước 3 của luồng quên mật khẩu:
 * Sau khi verify OTP thành công, gửi tempToken + mật khẩu mới để đặt lại.
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Token không được để trống")
    private String tempToken;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải gồm đúng 6 chữ số")
    private String code;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String newPassword;
}
