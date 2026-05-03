package com.techshop.productservice.service;

import com.techshop.common.service.CloudinaryService;
import com.techshop.productservice.model.Category;
import com.techshop.productservice.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy danh mục id=" + id));
    }

    public Category create(Category category) {
        // Validate name không trùng
        if (categoryRepository.existsByName(category.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Tên danh mục đã tồn tại");
        }
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category updated) {
        Category category = getById(id);
        
        // Validate name không trùng (exclude current category)
        Category existingCategory = categoryRepository.findByName(updated.getName());
        if (existingCategory != null && !existingCategory.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Tên danh mục đã tồn tại");
        }
        
        category.setName(updated.getName());
        category.setDescription(updated.getDescription());
        category.setImageUrl(updated.getImageUrl());
        category.setSlug(updated.getSlug());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục id=" + id);
        }
        
        // Check category có products trước khi xóa
        long productCount = categoryRepository.countProductsByCategoryId(id);
        if (productCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Không thể xóa danh mục đang có " + productCount + " sản phẩm");
        }
        
        categoryRepository.deleteById(id);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        return cloudinaryService.uploadImage(file, "categories");
    }
}
