package com.techshop.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload image to Cloudinary
     * @param file MultipartFile from request
     * @param folder Not used - kept for backward compatibility (can pass null or any string)
     * @return Image URL
     * All images will be uploaded to: Home/techshop/
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File phải là ảnh (jpg, png, gif, etc.)");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Kích thước file không được vượt quá 5MB");
        }

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "techshop",  // All images go to Home/techshop/
                            "resource_type", "image",
                            "transformation", ObjectUtils.asMap(
                                    "quality", "auto",
                                    "fetch_format", "auto"
                            )
                    )
            );

            String imageUrl = (String) uploadResult.get("secure_url");
            log.info("Image uploaded successfully: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new IOException("Không thể upload ảnh: " + e.getMessage());
        }
    }

    /**
     * Delete image from Cloudinary
     * @param imageUrl Full URL of image
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        try {
            // Extract public_id from URL
            // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/techshop/products/abc123.jpg
            // public_id = techshop/products/abc123
            String publicId = extractPublicId(imageUrl);
            
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Image deleted successfully: {}", publicId);
            }
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary: {}", imageUrl, e);
            // Don't throw exception, just log
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     */
    private String extractPublicId(String imageUrl) {
        try {
            // Split by "upload/"
            String[] parts = imageUrl.split("/upload/");
            if (parts.length < 2) return null;

            // Get part after "upload/"
            String afterUpload = parts[1];
            
            // Remove version (v1234567890/)
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", "");
            
            // Remove file extension
            int lastDot = withoutVersion.lastIndexOf('.');
            if (lastDot > 0) {
                return withoutVersion.substring(0, lastDot);
            }
            
            return withoutVersion;
        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", imageUrl, e);
            return null;
        }
    }

    /**
     * Upload multiple images
     */
    public String[] uploadImages(MultipartFile[] files, String folder) throws IOException {
        if (files == null || files.length == 0) {
            return new String[0];
        }

        String[] urls = new String[files.length];
        for (int i = 0; i < files.length; i++) {
            urls[i] = uploadImage(files[i], folder);
        }
        return urls;
    }
}
