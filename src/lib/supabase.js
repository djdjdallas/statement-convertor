import { createClient } from '@/utils/supabase/client'

// Create a singleton instance for client-side use
export const supabase = createClient()