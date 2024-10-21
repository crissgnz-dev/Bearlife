async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: username, password: password })
        });

        const result = await response.json();

        if (response.ok) {
            // Login exitoso, mostrar el nombre del usuario
            document.querySelector('.login').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('display-username').textContent = result.nombre;

            // Guardar el nombre de usuario en localStorage
            localStorage.setItem('username', result.nombre);
        } else {
            alert(result.message || 'Error en el login');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al iniciar sesión');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    
    if (username) {
        // Ocultar el div del formulario de login
        document.getElementById('login-section').style.display = 'none';

        // Mostrar el nombre del usuario y el botón de logout
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('user-info').style.flexDirection = 'column';
        document.getElementById('user-info').style.justifyContent = 'center';
        document.getElementById('user-info').style.alignItems = 'center';
        document.getElementById('display-username').textContent = username;
    }
});

function logout() {
    // Elimina el nombre de usuario de localStorage
    localStorage.removeItem('username');
    sessionStorage.removeItem('previousPage'); // Elimina la página de origen
    window.location.href = 'login.html'; // Redirige a la página de inicio de sesión

    // Volver a mostrar el formulario de login y los botones de login/sign up
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('auth-buttons').style.display = 'block';

    // Ocultar el nombre del usuario y el botón de logout
    document.getElementById('user-info').style.display = 'none';
}

function savePage() {
    // Guarda la URL actual en sessionStorage o localStorage
    sessionStorage.setItem('previousPage', window.location.href);
}

function volver(){
    // Recupera la página de origen desde sessionStorage
    const previousPage = sessionStorage.getItem('previousPage');
    if (previousPage) {
        window.location.href = previousPage; // Redirige a la página original
    } else {
        window.location.href = '/index.html'; // O redirige a una página por defecto
    }
}

