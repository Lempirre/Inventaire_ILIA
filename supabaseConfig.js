// Import the Supabase client
import { createClient } from '@supabase/supabase-js'

// Your Supabase project configuration
const supabaseUrl = 'https://yxejqvbgzndxrhoyylfi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZWpxdmJnem5keHJob3l5bGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDI3MTQsImV4cCI6MjA2NjAxODcxNH0.1PaaKC550EIxNUjeeWkgRprGX51_2lcrFg5_1oxavk4'

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: Export individual services if needed
export const supabaseAuth = supabase.auth
export const supabaseStorage = supabase.storage