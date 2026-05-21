// ==================== DATOS DE PRUEBA (LOCALES) ====================
// Simulamos preguntas - luego las reemplazaremos con Supabase
const preguntasLocal = [
    {
        id: 1,
        texto: "A partir de la tabla de preferencia, el docente busca promover la comprensión de la moda. ¿Cuál acción es más pertinente?",
        opciones: [
            "Dialogar sobre el término 'moda', anotar definición y preguntar por mayor frecuencia.",
            "Mostrar mapa conceptual con definición, indicar que es medida de tendencia central y proponer nueva situación.",
            "Pedir que elijan un juego según preferencias, preguntar por mayor frecuencia y explicar que esa frecuencia es la moda."
        ],
        correcta: "C",
        explicacion: "La opción C conecta la necesidad real (elegir juego) con el concepto de moda."
    },
    {
        id: 2,
        texto: "Los estudiantes tienen dificultades para construir un gráfico de barras. ¿Qué acción es más pertinente?",
        opciones: [
            "Solicitar que señalen ejes, discutan escala y dibujen barras.",
            "Distribuir piezas cuadradas para representar cada respuesta.",
            "Entregar gráfico incompleto con ejes y una barra."
        ],
        correcta: "A",
        explicacion: "La opción A guía la construcción paso a paso."
    },
    {
        id: 3,
        texto: "¿Cuál de los siguientes estudiantes deduce información del texto del ogro?",
        opciones: [
            "Alejo: 'El ogro dijo que sentía olor a carne humana'.",
            "Brenda: 'Juan le dijo a la giganta que no había comido nada'.",
            "Carmelo: 'Seguro que el ogro se hubiera comido a Juan si la giganta no lo escondía'."
        ],
        correcta: "C",
        explicacion: "Carmelo infiere una consecuencia no explícita."
    }
];

// Variables de estado
let preguntas = [];
let indiceActual = 0;
let respuestasUsuario = [];
let usuarioActual = null; // Guardará email

// Elementos del DOM
const authScreen = document.getElementById('authScreen');
const quizScreen = document.getElementById('quizScreen');
const userEmailSpan = document.getElementById('userEmail');
const currentQSpan = document.getElementById('currentQ');
const totalQSpan = document.getElementById('totalQ');
const progressFill = document.getElementById('progressFill');
const questionTextDiv = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const feedbackDiv = document.getElementById('feedback');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const logoutBtn = document.getElementById('logoutBtn');
const quizStatus = document.getElementById('quizStatus');

// Autenticación (simulada por ahora)
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const loginError = document.getElementById('loginError');
const regError = document.getElementById('regError');

// Simulación de usuarios (localStorage)
function registrarUsuario(email, password) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        regError.innerText = 'El correo ya está registrado';
        return false;
    }
    users.push({ email, password, plan: 'free', preguntasRespondidas: 0 });
    localStorage.setItem('users', JSON.stringify(users));
    regError.innerText = '';
    return true;
}

function iniciarSesion(email, password) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        loginError.innerText = 'Correo o contraseña incorrectos';
        return false;
    }
    usuarioActual = user;
    localStorage.setItem('sesion', JSON.stringify({ email: user.email }));
    loginError.innerText = '';
    return true;
}

function cerrarSesion() {
    localStorage.removeItem('sesion');
    usuarioActual = null;
    authScreen.classList.add('active');
    quizScreen.classList.remove('active');
    // Limpiar formularios
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function cargarPreguntasDesdeLocal() {
    preguntas = [...preguntasLocal];
    totalQSpan.innerText = preguntas.length;
    respuestasUsuario = new Array(preguntas.length).fill(null);
    indiceActual = 0;
    mostrarPregunta();
}

function mostrarPregunta() {
    const q = preguntas[indiceActual];
    questionTextDiv.innerText = q.texto;
    // Generar opciones
    optionsContainer.innerHTML = '';
    const letras = ['A', 'B', 'C'];
    q.opciones.forEach((opc, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'respuesta';
        radio.value = letras[idx];
        radio.id = `opt_${letras[idx]}`;
        const label = document.createElement('label');
        label.htmlFor = `opt_${letras[idx]}`;
        label.innerText = `${letras[idx]}. ${opc}`;
        div.appendChild(radio);
        div.appendChild(label);
        optionsContainer.appendChild(div);
    });
    // Restaurar respuesta anterior si existe
    const respAnterior = respuestasUsuario[indiceActual];
    if (respAnterior) {
        const radio = document.querySelector(`input[value="${respAnterior}"]`);
        if (radio) radio.checked = true;
        // Mostrar feedback ya guardado
        const pregunta = preguntas[indiceActual];
        const esCorrecta = (respAnterior === pregunta.correcta);
        feedbackDiv.innerHTML = esCorrecta ? '✅ Correcto' : `❌ Incorrecto. La correcta era ${pregunta.correcta}. ${pregunta.explicacion || ''}`;
        feedbackDiv.className = `feedback ${esCorrecta ? 'correct-feedback' : 'incorrect-feedback'}`;
    } else {
        feedbackDiv.innerHTML = '';
        feedbackDiv.className = 'feedback';
    }
    currentQSpan.innerText = indiceActual + 1;
    const porcentaje = ((indiceActual + 1) / preguntas.length) * 100;
    progressFill.style.width = `${porcentaje}%`;
    // Habilitar/deshabilitar botones
    prevBtn.disabled = (indiceActual === 0);
    nextBtn.disabled = false; // pero se deshabilitará si no ha respondido? Lo manejamos en evento
    // Control de siguiente si ya respondió
    const yaRespondio = (respuestasUsuario[indiceActual] !== null);
    if (!yaRespondio) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
    // Mostrar estado de suscripción (por ahora free)
    if (usuarioActual && usuarioActual.plan === 'free' && indiceActual >= 9) {
        quizStatus.innerText = '⚠️ Has alcanzado el límite de 10 preguntas en el plan gratuito. Para continuar, actualiza a Premium.';
        nextBtn.disabled = true;
    } else {
        quizStatus.innerText = '';
    }
}

function guardarRespuesta() {
    const seleccionado = document.querySelector('input[name="respuesta"]:checked');
    if (!seleccionado) {
        alert('Por favor selecciona una respuesta');
        return false;
    }
    const valor = seleccionado.value;
    respuestasUsuario[indiceActual] = valor;
    const pregunta = preguntas[indiceActual];
    const esCorrecta = (valor === pregunta.correcta);
    feedbackDiv.innerHTML = esCorrecta ? '✅ Correcto' : `❌ Incorrecto. La correcta es ${pregunta.correcta}. ${pregunta.explicacion || ''}`;
    feedbackDiv.className = `feedback ${esCorrecta ? 'correct-feedback' : 'incorrect-feedback'}`;
    // Si es plan free y ha respondido 10, mostrar límite
    if (usuarioActual && usuarioActual.plan === 'free') {
        const respondidas = respuestasUsuario.filter(r => r !== null).length;
        if (respondidas >= 10) {
            quizStatus.innerText = '⚠️ Límite de 10 preguntas alcanzado. Actualiza a Premium para más.';
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = false;
        }
    } else {
        nextBtn.disabled = false;
    }
    return true;
}

function siguientePregunta() {
    if (respuestasUsuario[indiceActual] === null) {
        const ok = guardarRespuesta();
        if (!ok) return;
    }
    if (indiceActual + 1 < preguntas.length) {
        // Verificar límite de 10 para free
        if (usuarioActual && usuarioActual.plan === 'free' && (indiceActual + 1) >= 10) {
            // Si ya está en la 10 y no es premium, no avanza
            if (indiceActual + 1 === 10 && respuestasUsuario[9] !== null) {
                quizStatus.innerText = 'Límite de preguntas gratuitas alcanzado.';
                return;
            }
        }
        indiceActual++;
        mostrarPregunta();
    } else {
        // Fin del examen
        const aciertos = respuestasUsuario.reduce((acc, resp, idx) => {
            return acc + (resp === preguntas[idx].correcta ? 1 : 0);
        }, 0);
        alert(`Examen completado. Acertaste ${aciertos} de ${preguntas.length}`);
        // Podríamos reiniciar o volver a inicio
    }
}

function anteriorPregunta() {
    if (indiceActual > 0) {
        indiceActual--;
        mostrarPregunta();
    }
}

// Eventos de autenticación (simulada)
btnLogin.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) {
        loginError.innerText = 'Completa todos los campos';
        return;
    }
    if (iniciarSesion(email, pass)) {
        authScreen.classList.remove('active');
        quizScreen.classList.add('active');
        userEmailSpan.innerText = usuarioActual.email;
        cargarPreguntasDesdeLocal();
    }
});

btnRegister.addEventListener('click', () => {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    if (!email || !pass || pass.length < 6) {
        regError.innerText = 'Correo válido y contraseña de mínimo 6 caracteres';
        return;
    }
    if (registrarUsuario(email, pass)) {
        // Auto login después de registro
        iniciarSesion(email, pass);
        authScreen.classList.remove('active');
        quizScreen.classList.add('active');
        userEmailSpan.innerText = usuarioActual.email;
        cargarPreguntasDesdeLocal();
    }
});

logoutBtn.addEventListener('click', cerrarSesion);

nextBtn.addEventListener('click', siguientePregunta);
prevBtn.addEventListener('click', anteriorPregunta);

// Opcional: al hacer clic en una opción, guardar automáticamente
optionsContainer.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
        guardarRespuesta();
    }
});

// Verificar sesión al cargar
window.addEventListener('DOMContentLoaded', () => {
    const sesion = localStorage.getItem('sesion');
    if (sesion) {
        const { email } = JSON.parse(sesion);
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        if (user) {
            usuarioActual = user;
            authScreen.classList.remove('active');
            quizScreen.classList.add('active');
            userEmailSpan.innerText = usuarioActual.email;
            cargarPreguntasDesdeLocal();
        } else {
            cerrarSesion();
        }
    } else {
        authScreen.classList.add('active');
        quizScreen.classList.remove('active');
    }
});

// Cambio de tabs en auth
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
        if (tab === 'login') document.getElementById('loginForm').classList.add('active');
        else document.getElementById('registerForm').classList.add('active');
    });
});