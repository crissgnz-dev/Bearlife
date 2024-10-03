document.addEventListener("DOMContentLoaded", function() {
    const images = [
        './imagenes/logo verano.png',
        './imagenes/logo invierno.png'
    ];

    const logoImg = document.getElementById('logo-img');
    let randomAnterior, randomActual;
    


    function rand() {
        randomAnterior = randomActual;
        randomActual = Math.floor(Math.random() * images.length);
    }

    function changeLogo() {
        rand();
        if (randomAnterior !== randomActual) {
            logoImg.classList.remove('show'); // Oculta la imagen actual
            setTimeout(() => {
                logoImg.src = images[randomActual];
                logoImg.classList.add('show'); // Muestra la nueva imagen
            }, 1000); // Espera el tiempo de la transición antes de cambiar la imagen
            console.log("El actual es: " + randomActual + " El anterior es: " + randomAnterior);
        }
    }

    // Cambiar el logo cada 10 segundos (10,000 ms)
    setInterval(changeLogo, 10000);
});

