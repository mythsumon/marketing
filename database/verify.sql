-- Verification queries to check if tables were created

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if specific tables exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
         THEN '✓ users table exists' 
         ELSE '✗ users table missing' 
    END as users_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regions') 
         THEN '✓ regions table exists' 
         ELSE '✗ regions table missing' 
    END as regions_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hotels') 
         THEN '✓ hotels table exists' 
         ELSE '✗ hotels table missing' 
    END as hotels_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') 
         THEN '✓ notes table exists' 
         ELSE '✗ notes table missing' 
    END as notes_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') 
         THEN '✓ activity_logs table exists' 
         ELSE '✗ activity_logs table missing' 
    END as activity_logs_check;




