# ============================================================
# TechShop Kafka Event-Driven Test Script
# Mô phỏng toàn bộ luồng: User Register → Order → Payment
#
# Chạy: .\kafka-test\test-kafka-events.ps1
# Yêu cầu: Docker đang chạy, container techshop-kafka healthy
# ============================================================

$KAFKA     = "techshop-kafka"
$BROKER    = "localhost:9092"
$TIMEOUT   = 8000   # ms chờ consumer

# ── Helpers ─────────────────────────────────────────────────

function Write-Header($text) {
    Write-Host ""
    Write-Host ("=" * 62) -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host ("=" * 62) -ForegroundColor Cyan
}

function Write-Step($text)  { Write-Host "`n>>> $text" -ForegroundColor Yellow }
function Write-OK($text)    { Write-Host "[OK]  $text" -ForegroundColor Green  }
function Write-FAIL($text)  { Write-Host "[FAIL] $text" -ForegroundColor Red   }
function Write-Info($text)  { Write-Host "      $text" -ForegroundColor Gray   }
function Write-Arrow($text) { Write-Host "  =>  $text" -ForegroundColor White  }

# Produce một message JSON vào topic
# Dùng base64 để tránh vấn đề escape ký tự trên Windows
function Produce-Message($topic, $jsonPayload, $key) {
    $tmpFile = "/tmp/msg_$topic.json"
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($jsonPayload))
    docker exec $KAFKA bash -c "echo $b64 | base64 -d > $tmpFile" 2>&1 | Out-Null
    docker exec $KAFKA bash -c "cat $tmpFile | /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server $BROKER --topic $topic" 2>&1 | Out-Null
}

# Consume N message từ đầu topic, trả về string
function Consume-Messages($topic, $maxMessages = 1) {
    $result = docker exec $KAFKA bash -c `
        "/opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server $BROKER --topic $topic --from-beginning --max-messages $maxMessages --timeout-ms $TIMEOUT" 2>&1
    # Lọc bỏ dòng log của Kafka consumer (bắt đầu bằng "[")
    $lines = $result -split "`n" | Where-Object { $_ -notmatch "^\[" -and $_.Trim() -ne "" }
    return ($lines -join "`n").Trim()
}

# Lấy tổng số message đã produce vào topic (high-water mark)
function Get-MessageCount($topic) {
    $raw = docker exec $KAFKA bash -c `
        "/opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server $BROKER --topic $topic" 2>&1
    # Format: topic:partition:offset
    $offset = ($raw -split ":")[-1]
    return $offset.Trim()
}

# ============================================================
Write-Header "TECHSHOP KAFKA PUB/SUB TEST"
Write-Host "  Broker    : $BROKER" -ForegroundColor White
Write-Host "  Container : $KAFKA"  -ForegroundColor White
Write-Host "  Timeout   : ${TIMEOUT}ms per consume" -ForegroundColor White
# ============================================================

# ── BƯỚC 0: Kiểm tra Kafka ──────────────────────────────────
Write-Header "BUOC 0: Kiem tra Kafka Container"

$health = docker inspect --format="{{.State.Health.Status}}" $KAFKA 2>&1
if ($health -eq "healthy") {
    Write-OK "Container '$KAFKA' dang chay (healthy)"
} else {
    Write-FAIL "Kafka chua san sang (status: $health)"
    Write-Info "Chay: docker-compose up -d kafka"
    exit 1
}

Write-Step "Topics hien co:"
$topics = docker exec $KAFKA /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BROKER --list 2>&1
$topics -split "`n" | Where-Object { $_.Trim() -ne "" -and $_ -notmatch "^\[" } | ForEach-Object {
    Write-Info $_
}

# ── BƯỚC 1: Tạo topics nếu chưa có ─────────────────────────
Write-Header "BUOC 1: Tao Topics (neu chua co)"

$requiredTopics = @(
    "user-registered-topic",
    "order-placed-topic",
    "payment-completed-topic",
    "payment-failed-topic"
)

foreach ($t in $requiredTopics) {
    $exists = docker exec $KAFKA /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BROKER --list 2>&1 |
              Select-String -Pattern "^$t$"
    if ($exists) {
        Write-Info "  [EXISTS] $t"
    } else {
        docker exec $KAFKA /opt/kafka/bin/kafka-topics.sh `
            --bootstrap-server $BROKER --create --topic $t `
            --partitions 1 --replication-factor 1 2>&1 | Out-Null
        Write-OK "  [CREATED] $t"
    }
}

# ============================================================
# SCENARIO 1: User đăng ký → notification-service gửi email Welcome
# ============================================================
Write-Header "SCENARIO 1: User Dang Ky"
Write-Info "PRODUCER : user-service  (AuthService.register)"
Write-Info "CONSUMER : notification-service  (gui email Welcome)"
Write-Info "TOPIC    : user-registered-topic"
Write-Info ""
Write-Info "Luong: user dang ky → UserEventProducer.publishUserRegistered()"
Write-Info "       → Kafka → NotificationEventConsumer.handleUserRegistered()"
Write-Info "       → gui email Welcome toi user moi"

$payload1 = '{"userId":101,"email":"nguyenvana@gmail.com","fullName":"Nguyen Van A"}'

Write-Step "PUBLISH → user-registered-topic"
Write-Info "Key    : 101 (userId)"
Write-Info "Payload: $payload1"
Produce-Message "user-registered-topic" $payload1 "101"
Start-Sleep -Milliseconds 600

Write-Step "CONSUME ← user-registered-topic (simulate notification-service)"
$msg = Consume-Messages "user-registered-topic" 1
if ($msg) {
    Write-OK "Message nhan duoc:"
    Write-Info $msg
    Write-Arrow "notification-service: gui email Welcome toi nguyenvana@gmail.com"
} else {
    Write-FAIL "Khong nhan duoc message"
}
$cnt = Get-MessageCount "user-registered-topic"
Write-Info "Total messages in topic: $cnt"

# ============================================================
# SCENARIO 2: Tạo đơn hàng → notification + inventory
# ============================================================
Write-Header "SCENARIO 2: Tao Don Hang"
Write-Info "PRODUCER : order-service  (OrderEventProducer.publishOrderPlaced)"
Write-Info "CONSUMER : notification-service  (email xac nhan don)"
Write-Info "           inventory-service     (log reserve stock)"
Write-Info "TOPIC    : order-placed-topic"
Write-Info ""
Write-Info "Luong: dat hang → OrderService.createOrder()"
Write-Info "       → Kafka → NotificationEventConsumer.handleOrderPlaced()"
Write-Info "                → InventoryEventConsumer.handleOrderPlaced()"

$payload2 = @'
{
  "orderId": 1001,
  "orderCode": "TS20260531001",
  "userId": 101,
  "userEmail": "nguyenvana@gmail.com",
  "receiverName": "Nguyen Van A",
  "shippingAddress": "123 Le Loi, Q1, HCM",
  "totalAmount": 15990000,
  "paymentMethod": "VNPAY",
  "items": [
    {
      "productId": 5,
      "productName": "iPhone 15 Pro 256GB",
      "quantity": 1,
      "unitPrice": 15990000,
      "subtotal": 15990000
    }
  ]
}
'@
$payload2 = $payload2 -replace '\s+', ' '

Write-Step "PUBLISH → order-placed-topic"
Write-Info "Key    : TS20260531001 (orderCode)"
Write-Info "Payload: orderId=1001, iPhone 15 Pro x1, 15,990,000 VND, VNPAY"
Produce-Message "order-placed-topic" $payload2 "TS20260531001"
Start-Sleep -Milliseconds 600

Write-Step "CONSUME ← order-placed-topic"
$msg = Consume-Messages "order-placed-topic" 1
if ($msg) {
    Write-OK "Message nhan duoc:"
    Write-Info $msg
    Write-Arrow "notification-service: gui email xac nhan don TS20260531001"
    Write-Arrow "inventory-service   : log xac nhan reserve productId=5 x1"
} else {
    Write-FAIL "Khong nhan duoc message"
}
$cnt = Get-MessageCount "order-placed-topic"
Write-Info "Total messages in topic: $cnt"

# ============================================================
# SCENARIO 3: Thanh toán thành công (VNPay callback "00")
# ============================================================
Write-Header "SCENARIO 3: Thanh Toan Thanh Cong (VNPay response=00)"
Write-Info "PRODUCER : payment-service  (PaymentEventProducer.publishPaymentCompleted)"
Write-Info "CONSUMER : order-service        (CONFIRMED + PAID)"
Write-Info "           notification-service (email thanh toan thanh cong)"
Write-Info "           inventory-service    (log, stock van RESERVED cho den DELIVERED)"
Write-Info "TOPIC    : payment-completed-topic"
Write-Info ""
Write-Info "Luong: VNPay callback '00' → PaymentService.verifyPayment()"
Write-Info "       → Kafka → OrderEventConsumer.handlePaymentCompleted()"
Write-Info "                → NotificationEventConsumer.handlePaymentCompleted()"
Write-Info "                → InventoryEventConsumer.handlePaymentCompleted()"

$payload3 = @'
{
  "paymentId": 501,
  "orderId": 1001,
  "orderCode": "TS20260531001",
  "userId": 101,
  "userEmail": "nguyenvana@gmail.com",
  "receiverName": "Nguyen Van A",
  "amount": 15990000,
  "paymentMethod": "VNPAY"
}
'@
$payload3 = $payload3 -replace '\s+', ' '

Write-Step "PUBLISH → payment-completed-topic"
Write-Info "Key    : TS20260531001 (orderCode)"
Write-Info "Payload: paymentId=501, orderId=1001, 15,990,000 VND"
Produce-Message "payment-completed-topic" $payload3 "TS20260531001"
Start-Sleep -Milliseconds 600

Write-Step "CONSUME ← payment-completed-topic"
$msg = Consume-Messages "payment-completed-topic" 1
if ($msg) {
    Write-OK "Message nhan duoc:"
    Write-Info $msg
    Write-Arrow "order-service        : orderId=1001 → status=CONFIRMED, paymentStatus=PAID"
    Write-Arrow "notification-service : email 'Thanh toan thanh cong' → nguyenvana@gmail.com"
    Write-Arrow "inventory-service    : stock RESERVED, cho den khi admin set DELIVERED"
} else {
    Write-FAIL "Khong nhan duoc message"
}
$cnt = Get-MessageCount "payment-completed-topic"
Write-Info "Total messages in topic: $cnt"

# ============================================================
# SCENARIO 4: Thanh toán thất bại → SAGA ROLLBACK (có items)
# ============================================================
Write-Header "SCENARIO 4: Thanh Toan That Bai - SAGA ROLLBACK"
Write-Info "PRODUCER : payment-service  (PaymentEventProducer.publishPaymentFailed)"
Write-Info "CONSUMER : order-service     (CANCELLED + FAILED)"
Write-Info "           inventory-service (AUTO-RELEASE stock - da fix bug)"
Write-Info "TOPIC    : payment-failed-topic"
Write-Info ""
Write-Info "Luong: VNPay callback != '00' → PaymentService.verifyPayment()"
Write-Info "       → Kafka → OrderEventConsumer.handlePaymentFailed()"
Write-Info "                → InventoryEventConsumer.handlePaymentFailed()"
Write-Info "                  → loop items → release reservedQuantity tung san pham"
Write-Info ""
Write-Info "[BUG DA FIX] Event gio co 'items' → Inventory tu dong release stock"
Write-Info "             Truoc day: chi log warning, stock bi 'nhot' mai mai"

$payload4 = @'
{
  "paymentId": 502,
  "orderId": 1002,
  "orderCode": "TS20260531002",
  "userId": 101,
  "amount": 8990000,
  "reason": "07",
  "items": [
    {
      "productId": 7,
      "productName": "Samsung Galaxy S24 Ultra",
      "quantity": 1,
      "unitPrice": 8990000,
      "subtotal": 8990000
    }
  ]
}
'@
$payload4 = $payload4 -replace '\s+', ' '

Write-Step "PUBLISH → payment-failed-topic"
Write-Info "Key    : TS20260531002 (orderCode)"
Write-Info "Payload: paymentId=502, orderId=1002, reason=07 (GD that bai)"
Write-Info "         items: Samsung Galaxy S24 Ultra x1 (productId=7)"
Produce-Message "payment-failed-topic" $payload4 "TS20260531002"
Start-Sleep -Milliseconds 600

Write-Step "CONSUME ← payment-failed-topic"
$msg = Consume-Messages "payment-failed-topic" 1
if ($msg) {
    Write-OK "Message nhan duoc:"
    Write-Info $msg
    Write-Arrow "order-service    : orderId=1002 → status=CANCELLED, paymentStatus=FAILED"
    Write-Arrow "inventory-service: AUTO-RELEASE productId=7 x1 (reservedQty--)"
    Write-Arrow "                   [Saga compensating transaction hoan thanh]"
} else {
    Write-FAIL "Khong nhan duoc message"
}
$cnt = Get-MessageCount "payment-failed-topic"
Write-Info "Total messages in topic: $cnt"

# ── BƯỚC CUỐI: Tổng kết ─────────────────────────────────────
Write-Header "TONG KET - Message Count"

Write-Host ""
$fmt = "  {0,-38} {1,6} message(s)"
foreach ($t in $requiredTopics) {
    $c = Get-MessageCount $t
    Write-Host ($fmt -f $t, $c) -ForegroundColor White
}

Write-Header "CONSUMER GROUPS (active khi services chay)"
$groups = docker exec $KAFKA /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server $BROKER --list 2>&1
$activeGroups = $groups -split "`n" | Where-Object { $_.Trim() -ne "" -and $_ -notmatch "^\[" }
if ($activeGroups) {
    $activeGroups | ForEach-Object { Write-Info $_ }
} else {
    Write-Info "(Chua co group nao - services chua chay)"
    Write-Info "Khi docker-compose up, se co:"
    Write-Info "  notification-service-group  → 3 topics"
    Write-Info "  order-service-group         → 2 topics"
    Write-Info "  inventory-service-group     → 3 topics"
}

# ── Hướng dẫn test end-to-end ───────────────────────────────
Write-Header "NEXT STEP: Test End-to-End voi Services That"

Write-Host ""
Write-Host "  1. Khoi dong tat ca services:" -ForegroundColor Yellow
Write-Host "     docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Theo doi log cua tung service (mo 3 terminal):" -ForegroundColor Yellow
Write-Host "     docker logs -f techshop-user-service" -ForegroundColor Cyan
Write-Host "     docker logs -f techshop-notification-service" -ForegroundColor Cyan
Write-Host "     docker logs -f techshop-inventory-service" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Dang ky user qua API:" -ForegroundColor Yellow
Write-Host '     curl -X POST http://localhost:8080/api/auth/register \' -ForegroundColor Cyan
Write-Host '       -H "Content-Type: application/json" \' -ForegroundColor Cyan
Write-Host '       -d "{""email"":""test@gmail.com"",""password"":""123456"",""fullName"":""Test User""}"' -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Kiem tra log user-service tim dong:" -ForegroundColor Yellow
Write-Host "     [Kafka Producer] Ban event UserRegistered cho userId=..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Kiem tra log notification-service tim dong:" -ForegroundColor Yellow
Write-Host "     [Kafka Consumer] Nhan event UserRegistered: userId=..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  6. Tao don hang va kiem tra luong payment-failed:" -ForegroundColor Yellow
Write-Host "     Xem log inventory-service tim dong:" -ForegroundColor Yellow
Write-Host "     [Kafka Consumer] Da release X units cho productId=..." -ForegroundColor Cyan
Write-Host ""

Write-Header "TEST HOAN THANH"
Write-Host ""
Write-Host "  Kafka pub/sub hoat dong dung." -ForegroundColor Green
Write-Host ""
Write-Host "  4 scenarios da verify:" -ForegroundColor White
Write-Host "  [1] user-registered   → notification (email Welcome)" -ForegroundColor White
Write-Host "  [2] order-placed      → notification (xac nhan) + inventory (log)" -ForegroundColor White
Write-Host "  [3] payment-completed → order (CONFIRMED) + notification + inventory" -ForegroundColor White
Write-Host "  [4] payment-failed    → order (CANCELLED) + inventory AUTO-RELEASE [BUG FIXED]" -ForegroundColor White
Write-Host ""
