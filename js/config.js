import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ✅ Tu URL del proyecto (sin /rest/v1/ ni barra final)
const SUPABASE_URL = 'https://iypmecayprwttjwgjgfz.supabase.co'

// ✅ Tu nueva publishable key (la que viste en API Keys)
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_h9wl8_hwOY-M6FNXmqoOiQ_U5_F7kax'

// Crear y exportar el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// Función auxiliar para obtener el usuario actual
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}