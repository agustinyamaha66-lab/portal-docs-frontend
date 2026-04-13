import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hkoxfkslvyefkbkxwmso.supabase.co'
const SUPABASE_KEY = 'sb_publishable_9lBEBfXMCclBwKI3Yvolqw_pQpCM8Ek'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
