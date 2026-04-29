package com.techshop.notificationservice.service;

import com.techshop.notificationservice.dto.OrderConfirmEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw e;
        }
    }

    public void sendOrderConfirmEmail(OrderConfirmEmailRequest request) {
        String subject = "[TechShop] Xác nhận đơn hàng #" + request.getOrderCode();
        String body = String.format(
                "Xin chào %s,\n\n" +
                "Đơn hàng #%s của bạn đã được xác nhận thành công!\n\n" +
                "Tổng tiền: %,.0f VNĐ\n" +
                "Địa chỉ giao hàng: %s\n" +
                "Phương thức thanh toán: %s\n\n" +
                "Cảm ơn bạn đã mua sắm tại TechShop!\n" +
                "Hotline hỗ trợ: 1800-xxxx",
                request.getCustomerName(),
                request.getOrderCode(),
                request.getTotalAmount(),
                request.getShippingAddress(),
                request.getPaymentMethod()
        );
        sendSimpleEmail(request.getEmail(), subject, body);
    }

    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "[TechShop] Chào mừng bạn đến với TechShop!";
        String body = String.format(
                "Xin chào %s,\n\n" +
                "Chào mừng bạn đã đăng ký tài khoản tại TechShop - Thiết bị điện tử chính hãng!\n\n" +
                "Khám phá hàng ngàn sản phẩm công nghệ với giá tốt nhất tại: http://techshop.vn\n\n" +
                "Trân trọng,\nĐội ngũ TechShop",
                fullName
        );
        sendSimpleEmail(to, subject, body);
    }

    public void sendShippingEmail(String to, String customerName, String orderCode, String trackingCode) {
        String subject = "[TechShop] Đơn hàng #" + orderCode + " đang được giao";
        String body = String.format(
                "Xin chào %s,\n\n" +
                "Đơn hàng #%s của bạn đang trên đường giao đến bạn!\n" +
                "Mã vận đơn: %s\n\n" +
                "Dự kiến giao hàng trong 2-3 ngày làm việc.\n\n" +
                "Trân trọng,\nĐội ngũ TechShop",
                customerName, orderCode, trackingCode
        );
        sendSimpleEmail(to, subject, body);
    }
}
