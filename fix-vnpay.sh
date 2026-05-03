#!/bin/bash

# Fix VNPay Redirect Issue
# This script adds payment_url column to orders table

echo "=========================================="
echo "Fix VNPay Redirect Issue"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="techshop_orderdb"
DB_USER="root"

echo -e "${YELLOW}This script will:${NC}"
echo "1. Add payment_url column to orders table"
echo "2. Verify the column was added"
echo ""

# Prompt for password
echo -n "Enter MySQL root password: "
read -s DB_PASS
echo ""
echo ""

# Check if MySQL is accessible
echo -e "${YELLOW}Checking MySQL connection...${NC}"
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cannot connect to MySQL. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL connection successful${NC}"
echo ""

# Check if database exists
echo -e "${YELLOW}Checking if database exists...${NC}"
DB_EXISTS=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SHOW DATABASES LIKE '$DB_NAME'" | grep $DB_NAME)

if [ -z "$DB_EXISTS" ]; then
    echo -e "${RED}❌ Database $DB_NAME does not exist${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database $DB_NAME exists${NC}"
echo ""

# Check if orders table exists
echo -e "${YELLOW}Checking if orders table exists...${NC}"
TABLE_EXISTS=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES LIKE 'orders'" | grep orders)

if [ -z "$TABLE_EXISTS" ]; then
    echo -e "${RED}❌ Table orders does not exist${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Table orders exists${NC}"
echo ""

# Check if column already exists
echo -e "${YELLOW}Checking if payment_url column already exists...${NC}"
COLUMN_EXISTS=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW COLUMNS FROM orders LIKE 'payment_url'" | grep payment_url)

if [ ! -z "$COLUMN_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Column payment_url already exists. Skipping...${NC}"
    echo ""
    echo -e "${GREEN}✅ Database is already up to date!${NC}"
    exit 0
fi

echo -e "${YELLOW}Column payment_url does not exist. Adding...${NC}"
echo ""

# Add column
echo -e "${YELLOW}Adding payment_url column...${NC}"
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME << EOF
ALTER TABLE orders 
ADD COLUMN payment_url VARCHAR(1000) NULL 
COMMENT 'VNPay payment URL for online payment';
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to add column${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Column added successfully${NC}"
echo ""

# Verify column was added
echo -e "${YELLOW}Verifying column...${NC}"
COLUMN_VERIFY=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW COLUMNS FROM orders LIKE 'payment_url'" | grep payment_url)

if [ -z "$COLUMN_VERIFY" ]; then
    echo -e "${RED}❌ Column verification failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Column verified${NC}"
echo ""

# Show column details
echo -e "${YELLOW}Column details:${NC}"
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = '$DB_NAME' 
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME = 'payment_url';
"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Fix completed successfully!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart Order Service:"
echo "   cd techshop-microservice/order-service"
echo "   mvn spring-boot:run"
echo ""
echo "2. Test VNPay payment:"
echo "   - Go to http://localhost:5173/checkout"
echo "   - Select VNPay payment method"
echo "   - Click 'Đặt hàng ngay'"
echo "   - You should be redirected to VNPay"
echo ""
echo -e "${GREEN}Done!${NC}"
