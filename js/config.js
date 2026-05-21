import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://tusupabaseurl.supabase.co'
const SUPABASE_ANON_KEY = 'tu-anon-key-publica'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Función para obtener el usuario actual
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}