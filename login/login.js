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
        } else {
            alert(result.message || 'Error en el login');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al iniciar sesión');
    }
}
