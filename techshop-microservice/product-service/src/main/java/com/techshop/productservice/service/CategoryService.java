package com.techshop.productservice.service;

import com.techshop.common.service.CloudinaryService;
import com.techshop.productservice.enums.ErrorCode;
import com.techshop.productservice.exception.AppException;
import com.techshop.productservice.model.Category;
import com.techshop.productservice.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    public Category create(Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category updated) {
        Category category = getById(id);
        
        Category existingCategory = categoryRepository.findByName(updated.getName());
        if (existingCategory != null && !existingCategory.getId().equals(id)) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }
        
        category.setName(updated.getName());
        category.setDescription(updated.getDescription());
        category.setImageUrl(updated.getImageUrl());
        category.setSlug(updated.getSlug());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        
        long productCount = categoryRepository.countProductsByCategoryId(id);
        if (productCount > 0) {
            throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
        }
        
        categoryRepository.deleteById(id);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        return cloudinaryService.uploadImage(file, "categories");
    }
}
