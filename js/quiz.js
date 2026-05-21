import { supabase, getCurrentUser } from './config.js'

let currentQuestions = []       // Array de preguntas obtenidas de la BD
let currentIndex = 0
let userResponses = []          // Guarda las respuestas seleccionadas (para mostrar al final)
let isPremium = false
let freeQuestionsLimit = 10

// Elementos del DOM
const questionText = document.getElementById('questionText')
const optionsContainer = document.getElementById('optionsContainer')
const feedbackArea = document.getElementById('feedbackArea')
const checkBtn = document.getElementById('checkBtn')
const nextBtn = document.getElementById('nextBtn')
const progressBar = document.getElementById('progressBar')
const progressText = document.getElementById('progressText')
const paymentBanner = document.getElementById('paymentBanner')
const userEmailDisplay = document.getElementById('userEmailDisplay')
const logoutBtn = document.getElementById('logoutBtn')

// Cargar datos iniciales
async function initQuiz() {
    const user = await getCurrentUser()
    if (!user) {
        window.location.href = 'login.html'
        return
    }
    userEmailDisplay.textContent = user.email
    
    // Verificar estado premium y contador de preguntas
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan_type, questions_answered')
        .eq('id', user.id)
        .single()
    
    if (userError && userError.code !== 'PGRST116') {
        console.error(userError)
        // Si no existe registro en users, lo creamos
        if (userError.code === 'PGRST116') {
            await supabase.from('users').insert([{ id: user.id, email: user.email, plan_type: 'free', questions_answered: 0 }])
            isPremium = false
        }
    } else {
        isPremium = userData?.plan_type === 'premium'
        if (userData?.questions_answered >= freeQuestionsLimit && !isPremium) {
            paymentBanner.style.display = 'block'
            disableQuiz(true)
            return
        }
    }
    
    // Cargar preguntas (por ahora todas las de primaria/forma1, puedes filtrar según necesites)
    const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('nivel', 'primaria')
        .eq('forma', 'forma1')
        .limit(50) // ajusta según necesites
    
    if (qError) {
        console.error(qError)
        questionText.textContent = 'Error al cargar preguntas'
        return
    }
    currentQuestions = questions
    if (currentQuestions.length === 0) {
        questionText.textContent = 'No hay preguntas disponibles'
        return
    }
    loadQuestion()
}

function loadQuestion() {
    // Limpiar feedback y opciones anteriores
    feedbackArea.innerHTML = ''
    feedbackArea.className = 'feedback-area'
    nextBtn.disabled = true
    checkBtn.disabled = false
    
    const q = currentQuestions[currentIndex]
    questionText.textContent = q.text
    
    // Generar opciones
    optionsContainer.innerHTML = ''
    const letras = ['A', 'B', 'C']
    const opciones = [q.option_a, q.option_b, q.option_c]
    opciones.forEach((texto, idx) => {
        const div = document.createElement('div')
        div.className = 'option'
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.name = 'question'
        radio.value = letras[idx]
        radio.id = `opt_${letras[idx]}`
        const label = document.createElement('label')
        label.htmlFor = `opt_${letras[idx]}`
        label.innerHTML = `<strong>${letras[idx]}</strong>. ${texto}`
        div.appendChild(radio)
        div.appendChild(label)
        optionsContainer.appendChild(div)
    })
    
    // Actualizar barra de progreso
    const percent = ((currentIndex + 1) / currentQuestions.length) * 100
    progressBar.style.width = `${percent}%`
    progressText.textContent = `Pregunta ${currentIndex + 1} de ${currentQuestions.length}`
}

// Verificar respuesta seleccionada
checkBtn.addEventListener('click', async () => {
    const selectedRadio = document.querySelector('input[name="question"]:checked')
    if (!selectedRadio) {
        Swal.fire('Aviso', 'Selecciona una opción antes de verificar', 'info')
        return
    }
    const selectedValue = selectedRadio.value
    const currentQ = currentQuestions[currentIndex]
    const isCorrect = (selectedValue === currentQ.correct_answer)
    
    // Registrar respuesta en Supabase
    const user = await getCurrentUser()
    if (user) {
        const { error: insertError } = await supabase
            .from('user_answers')
            .insert([{
                user_id: user.id,
                question_id: currentQ.id,
                selected_option: selectedValue,
                is_correct: isCorrect
            }])
        
        if (!insertError) {
            // Incrementar contador de preguntas respondidas en users
            const { data: userData } = await supabase
                .from('users')
                .select('questions_answered')
                .eq('id', user.id)
                .single()
            const newCount = (userData?.questions_answered || 0) + 1
            await supabase
                .from('users')
                .update({ questions_answered: newCount })
                .eq('id', user.id)
            
            // Verificar límite de preguntas gratis
            if (!isPremium && newCount >= freeQuestionsLimit) {
                paymentBanner.style.display = 'block'
                disableQuiz(true)
                return
            }
        }
    }
    
    // Mostrar feedback
    let feedbackHtml = ''
    if (isCorrect) {
        feedbackHtml = `<div class="correct-feedback">✅ Correcto. ${currentQ.explanation ? currentQ.explanation : ''}</div>`
    } else {
        feedbackHtml = `<div class="incorrect-feedback">❌ Incorrecto. La respuesta correcta era ${currentQ.correct_answer}. ${currentQ.explanation ? currentQ.explanation : ''}</div>`
    }
    feedbackArea.innerHTML = feedbackHtml
    feedbackArea.classList.add('correct-feedback', 'incorrect-feedback') // según sea el caso
    
    checkBtn.disabled = true
    nextBtn.disabled = false
})

// Siguiente pregunta
nextBtn.addEventListener('click', () => {
    if (currentIndex + 1 < currentQuestions.length) {
        currentIndex++
        loadQuestion()
    } else {
        Swal.fire('¡Felicidades!', 'Has completado todas las preguntas disponibles.', 'success')
        // Opcional: mostrar resumen final
    }
})

function disableQuiz(disabled) {
    checkBtn.disabled = disabled
    nextBtn.disabled = disabled
    const radios = document.querySelectorAll('input[name="question"]')
    radios.forEach(r => r.disabled = disabled)
}

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = 'login.html'
})

// Iniciar
initQuiz()