// auth.js
import { supabase } from './config.js'

const form = document.getElementById('loginForm')
form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    // Intento de inicio de sesión
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        // Si no existe, registrar nuevo usuario
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) return alert('Error: ' + signUpError.message)
        alert('Usuario creado. Revisa tu correo para confirmar (si está habilitada la confirmación).')
    } else {
        window.location.href = 'index.html'
    }
})