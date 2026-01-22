-- RUN THIS IN PGADMIN TO COMPLETE THE SETUP

-- Add columns to session_bookings table to support class sessions
ALTER TABLE session_bookings 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES tuition_classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'individual' CHECK (session_type IN ('individual', 'class')),
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_bookings_class ON session_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_type ON session_bookings(session_type);

-- Update session_payments table for class payments
ALTER TABLE session_payments 
ALTER COLUMN session_id DROP NOT NULL,
ALTER COLUMN screenshot_path DROP NOT NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES tuition_classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'individual' CHECK (payment_type IN ('individual', 'monthly', 'hourly'));

-- Create index for class payments
CREATE INDEX IF NOT EXISTS idx_session_payments_class ON session_payments(class_id);

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'session_bookings' 
AND column_name IN ('class_id', 'session_type', 'is_recurring')
UNION ALL
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'session_payments' 
AND column_name IN ('class_id', 'payment_type', 'session_id', 'screenshot_path');
