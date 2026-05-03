-- Add payment_url column to orders table
-- This column stores the VNPay payment URL for online payment methods

USE techshop_orderdb;

-- Check if column exists before adding
SET @dbname = 'techshop_orderdb';
SET @tablename = 'orders';
SET @columnname = 'payment_url';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(1000) NULL COMMENT ''VNPay payment URL for online payment'';')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'techshop_orderdb' 
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME = 'payment_url';
