import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://teufwhvkfjluawtcvjwh.supabase.co'
const supabasePublishableKey = 'sb_publishable_yWyeVy6oGOgIPjzVb6hpWA_Hk4Korw9'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
