import { supabase } from './config.js'

// Esperar a que el DOM cargue
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm')
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginOrRegister)
    }

    // Si ya hay sesión activa y estamos en login.html, redirigir al simulacro
    checkExistingSession()
})

async function handleLoginOrRegister(e) {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const messageDiv = document.getElementById('message')

    if (!email || !password) {
        showMessage('❌ Completa ambos campos', 'error')
        return
    }

    // 1. Intentar iniciar sesión
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        // Si el error es "Invalid login credentials", intentar registrar nuevo usuario
        if (error.message === 'Invalid login credentials') {
            showMessage('Creando nueva cuenta...', 'info')
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
            if (signUpError) {
                showMessage('❌ Error al registrar: ' + signUpError.message, 'error')
                return
            }
            // Inicio de sesión automático después de registrarse (si no requiere confirmación de email)
            if (signUpData.user) {
                // Crear el registro en public.users
                await createOrUpdatePublicUser(signUpData.user)
                showMessage('✅ Cuenta creada. Redirigiendo...', 'success')
                setTimeout(() => { window.location.href = 'index.html' }, 1500)
            } else {
                showMessage('📧 Revisa tu correo para confirmar la cuenta', 'info')
            }
        } else {
            showMessage('❌ ' + error.message, 'error')
        }
        return
    }

    // 2. Login exitoso
    if (data.user) {
        await createOrUpdatePublicUser(data.user)
        showMessage('✅ Ingreso exitoso. Redirigiendo...', 'success')
        setTimeout(() => { window.location.href = 'index.html' }, 1000)
    }
}

// Función para asegurar que exista un registro en public.users
async function createOrUpdatePublicUser(user) {
    if (!user) return

    // Verificar si ya existe
    const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error al buscar usuario:', fetchError)
        return
    }

    if (!existing) {
        // Crear registro con valores por defecto
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                plan_type: 'free',
                questions_answered: 0,
                subscription_end: null
            })
        if (insertError) {
            console.error('Error al insertar en public.users:', insertError)
        } else {
            console.log('✅ Usuario creado en public.users')
        }
    } else {
        console.log('ℹ️ Usuario ya existía en public.users')
    }
}

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message')
    if (messageDiv) {
        messageDiv.textContent = msg
        messageDiv.className = `message ${type}`
        messageDiv.style.display = 'block'
        setTimeout(() => { messageDiv.style.display = 'none' }, 3000)
    } else {
        alert(msg)
    }
}

async function checkExistingSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html'
    }
}