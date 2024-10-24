async function signUp(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            // Redirige a la página de inicio de sesión después de crear la cuenta
            window.location.href = '../login/login.html'; // Subir un nivel y luego ir a login
        } else if (response.status === 409) {
            const result = await response.json();
            alert(result.message || 'Error al crear la cuenta');
        } else {
            const result = await response.json();
            alert(result.message || 'Error al crear la cuenta');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al crear la cuenta');
    }
}