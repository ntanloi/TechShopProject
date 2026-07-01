package com.techshop.paymentservice.exception;

import com.techshop.paymentservice.dto.ApiResponse;
import com.techshop.paymentservice.enums.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String SERVICE_PREFIX = "PAY";

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        String correlationId = resolveCorrelationId();
        log.warn("[{}] AppException correlationId={} userId={} - {}",
                toTag(errorCode),
                correlationId,
                resolveUserId(),
                errorCode.getMessage());

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .tag(toTag(errorCode))
                .message(errorCode.getMessage())
                .correlationId(correlationId)
                .build();

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handlingValidation(MethodArgumentNotValidException exception) {
        var fieldError = exception.getFieldError();
        String enumKey = fieldError != null ? fieldError.getDefaultMessage() : null;

        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        if (enumKey != null) {
            try {
                errorCode = ErrorCode.valueOf(enumKey);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown error code: {}", enumKey);
            }
        }

        String correlationId = resolveCorrelationId();
        log.warn("[{}] ValidationFailed correlationId={} userId={} - {}",
                toTag(errorCode),
                correlationId,
                resolveUserId(),
                errorCode.getMessage());

        return ResponseEntity.badRequest()
                .body(ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .tag(toTag(errorCode))
                        .message(errorCode.getMessage())
                        .correlationId(correlationId)
                        .build());
    }

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse<Void>> handlingRuntimeException(Exception exception) {
        String correlationId = resolveCorrelationId();
        log.error("[{}] RuntimeException correlationId={} userId={} - {}",
                toTag(ErrorCode.UNCATEGORIZED_EXCEPTION),
                correlationId,
                resolveUserId(),
                exception.getMessage(),
                exception);
        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .tag(toTag(errorCode))
                .message(errorCode.getMessage())
                .correlationId(correlationId)
                .build();

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    private String toTag(ErrorCode errorCode) {
        return SERVICE_PREFIX + "-" + errorCode.getCode();
    }

    private String resolveCorrelationId() {
        String correlationId = MDC.get("correlationId");
        return (correlationId != null && !correlationId.isBlank()) ? correlationId : "unknown";
    }

    private String resolveUserId() {
        String userId = MDC.get("userId");
        return (userId != null && !userId.isBlank()) ? userId : "anonymous";
    }
}
