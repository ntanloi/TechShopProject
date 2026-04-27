package com.techshop.userservice.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String address;
    private String avatarUrl;
}
