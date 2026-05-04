package com.techshop.notificationservice.service;

import com.techshop.notificationservice.dto.OrderConfirmEmailRequest;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, "TechShop Support");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
            log.info("HTML Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }

    @Async
    public void sendOrderConfirmEmail(OrderConfirmEmailRequest request) {
        String subject = "[TechShop] Xác nhận đơn hàng #" + request.getOrderCode();
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #FF8C00, #FF4500); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">TechShop - Xác nhận đơn hàng</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Cảm ơn bạn đã tin tưởng mua sắm tại <strong>TechShop</strong>. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #FF4500; border-bottom: 2px solid #FF4500; display: inline-block;">Thông tin đơn hàng</h3>
                        <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> <span style="color: #FF4500;">#%s</span></p>
                        <p style="margin: 5px 0;"><strong>Thời gian:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Tổng thanh toán:</strong> <span style="font-size: 18px; color: #FF4500;">%,.0f VNĐ</span></p>
                    </div>

                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #FF4500; border-bottom: 2px solid #FF4500; display: inline-block;">Giao hàng & Thanh toán</h3>
                        <p style="margin: 5px 0;"><strong>Địa chỉ giao hàng:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Phương thức:</strong> %s</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173/orders/%s" style="background: #FF4500; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Theo dõi đơn hàng</a>
                    </div>
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 5px 0;">Hotline hỗ trợ: 1800-xxxx (Miễn phí)</p>
                    <p style="margin: 5px 0;">&copy; 2024 TechShop - All Rights Reserved</p>
                </div>
            </div>
            """,
                request.getCustomerName(),
                request.getOrderCode(),
                dateStr,
                request.getTotalAmount(),
                request.getShippingAddress(),
                request.getPaymentMethod(),
                request.getOrderId()
        );
        sendHtmlEmail(request.getEmail(), subject, htmlBody);
    }

    @Async
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "Chào mừng bạn đến với TechShop!";
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #FF8C00, #FF4500); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Chào mừng bạn đến với TechShop!</h1>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 18px;">Xin chào <strong>%s</strong>,</p>
                    <p>Chúng tôi rất vui mừng khi bạn gia nhập cộng đồng yêu công nghệ của TechShop.</p>
                    <p>Hãy bắt đầu khám phá những thiết bị điện tử mới nhất với ưu đãi dành riêng cho thành viên mới!</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173" style="background: #FF4500; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Mua sắm ngay</a>
                    </div>
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 5px 0;">TechShop - Trải nghiệm công nghệ đỉnh cao</p>
                    <p style="margin: 5px 0;">&copy; 2024 TechShop - All Rights Reserved</p>
                </div>
            </div>
            """,
                fullName
        );
        sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    public void sendOrderCancelEmail(OrderConfirmEmailRequest request) {
        String subject = "[TechShop] Thông báo hủy đơn hàng #" + request.getOrderCode();
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #FF8C00, #FF4500); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">TechShop - Thông báo hủy đơn hàng</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Chúng tôi xác nhận đơn hàng <strong style="color: #FF4500;">#%s</strong> của bạn đã được hủy thành công.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4500;">
                        <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Thời gian hủy:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Tổng tiền hoàn lại (nếu có):</strong> <span style="color: #FF4500; font-weight: bold;">%,.0f VNĐ</span></p>
                    </div>

                    <p>Nếu bạn không thực hiện yêu cầu này hoặc có thắc mắc, vui lòng liên hệ hotline để được hỗ trợ.</p>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173/orders/%s" style="background: #FF4500; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem lại đơn hàng</a>
                    </div>
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 5px 0;">Cảm ơn bạn đã quan tâm đến TechShop.</p>
                    <p style="margin: 5px 0;">&copy; 2024 TechShop - All Rights Reserved</p>
                </div>
            </div>
            """,
                request.getCustomerName(),
                request.getOrderCode(),
                request.getOrderCode(),
                dateStr,
                request.getTotalAmount(),
                request.getOrderId()
        );
        sendHtmlEmail(request.getEmail(), subject, htmlBody);
    }

    @Async
    public void sendOrderDeliveredEmail(OrderConfirmEmailRequest request) {
        String subject = "[TechShop] Đơn hàng #" + request.getOrderCode() + " đã giao thành công!";
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #FF8C00, #FF4500); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Giao hàng thành công!</h1>
                    <p style="margin: 10px 0 0;">Cảm ơn bạn đã mua sắm tại TechShop</p>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>TechShop rất vui mừng thông báo đơn hàng <strong style="color: #FF4500;">#%s</strong> của bạn đã được giao thành công vào lúc <strong>%s</strong>.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; border: 1px dashed #FF4500;">
                        <p style="margin: 0 0 15px; font-size: 16px;">Bạn có hài lòng với sản phẩm không?</p>
                        <a href="http://localhost:5173/orders/%s" style="background: #FF4500; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Viết đánh giá ngay</a>
                    </div>

                    <p>Sự hài lòng của bạn là động lực để chúng tôi hoàn thiện hơn mỗi ngày.</p>
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 5px 0;">TechShop - Trải nghiệm công nghệ đỉnh cao</p>
                    <p style="margin: 5px 0;">&copy; 2024 TechShop - All Rights Reserved</p>
                </div>
            </div>
            """,
                request.getCustomerName(),
                request.getOrderCode(),
                dateStr,
                request.getOrderId()
        );
        sendHtmlEmail(request.getEmail(), subject, htmlBody);
    }

    @Async
    public void sendPaymentSuccessEmail(OrderConfirmEmailRequest request) {
        String subject = "[TechShop] Xác nhận thanh toán thành công cho đơn hàng #" + request.getOrderCode();
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #28a745, #218838); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Thanh toán thành công!</h1>
                    <p style="margin: 10px 0 0;">Giao dịch của bạn đã được xác nhận</p>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>TechShop xác nhận đã nhận được thanh toán cho đơn hàng <strong style="color: #218838;">#%s</strong>.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Số tiền đã thanh toán:</strong> <span style="color: #218838; font-weight: bold;">%,.0f VNĐ</span></p>
                        <p style="margin: 5px 0;"><strong>Thời gian:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="color: #218838;">Đã thanh toán</span></p>
                    </div>

                    <p>Chúng tôi đang tiến hành chuẩn bị hàng và sẽ thông báo cho bạn ngay khi hàng được gửi đi.</p>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173/orders/%s" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem chi tiết đơn hàng</a>
                    </div>
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 5px 0;">Cảm ơn bạn đã tin dùng TechShop.</p>
                    <p style="margin: 5px 0;">&copy; 2024 TechShop - All Rights Reserved</p>
                </div>
            </div>
            """,
                request.getCustomerName(),
                request.getOrderCode(),
                request.getOrderCode(),
                request.getTotalAmount(),
                dateStr,
                request.getOrderId()
        );
        sendHtmlEmail(request.getEmail(), subject, htmlBody);
    }
}
