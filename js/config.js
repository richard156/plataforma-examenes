import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://iypmecayprwttjwgjgfz.supabase.co/rest/v1/'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cG1lY2F5cHJ3dHRqd2dqZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjE0MzEsImV4cCI6MjA5NDg5NzQzMX0.5PAQbo_4yIi3QDMVn48x0oJWEmIY54MTpLheVzpKR14
'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Función para obtener el usuario actual
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}