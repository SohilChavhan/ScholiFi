import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfdwqwkernphhvpnitup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZHdxd2tlcm5waGh2cG5pdHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NjYyNDgsImV4cCI6MjEwMDU0MjI0OH0.-vgejoWixNMhJPPQQ8gqy8GgjQ8B-aGoslZdg6jvVNU';

export const supabase = createClient(supabaseUrl, supabaseKey);