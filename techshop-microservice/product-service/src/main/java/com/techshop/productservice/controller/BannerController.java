package com.techshop.productservice.controller;

import com.techshop.productservice.model.Banner;
import com.techshop.productservice.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    // =================== PUBLIC ===================

    @GetMapping("/active")
    public ResponseEntity<List<Banner>> getActiveBannersByPosition(@RequestParam String position) {
        return ResponseEntity.ok(bannerRepository.findActiveBanners(position));
    }

    // =================== ADMIN ===================

    @GetMapping
    public ResponseEntity<List<Banner>> getAll() {
        return ResponseEntity.ok(bannerRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Banner> getById(@PathVariable Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy banner id=" + id));
        return ResponseEntity.ok(banner);
    }

    @PostMapping
    public ResponseEntity<Banner> create(@RequestBody Banner banner) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bannerRepository.save(banner));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Banner> update(@PathVariable Long id, @RequestBody Banner updated) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy banner id=" + id));
        
        banner.setTitle(updated.getTitle());
        banner.setImageUrl(updated.getImageUrl());
        banner.setLinkUrl(updated.getLinkUrl());
        banner.setPosition(updated.getPosition());
        banner.setDisplayOrder(updated.getDisplayOrder());
        banner.setActive(updated.isActive());
        banner.setStartDate(updated.getStartDate());
        banner.setEndDate(updated.getEndDate());

        return ResponseEntity.ok(bannerRepository.save(banner));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy banner id=" + id);
        }
        bannerRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa banner id=" + id);
    }
}
