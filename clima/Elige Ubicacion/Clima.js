const apiKey = '4a05cc810f6086d5c98e5b6aedf922f7';
let city = "Buenos Aires";
let tiempoRestante = 10; // Tiempo en segundos
let intervalId;

function TomarClima() {
    const weatherDiv = document.getElementById('weather');
    weatherDiv.innerHTML = '';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let cityWeather = document.getElementById('cityWeather');
            if (!cityWeather) {
                cityWeather = document.createElement('div');
                cityWeather.id = 'cityWeather';
                weatherDiv.appendChild(cityWeather);
            }
            cityWeather.innerHTML = `
                <a href="https://www.google.com.ar/maps/place/${city}" target="blank_"><h1>${data.name}</h1></a>
                <p>La Temperatura: ${data.main.temp}°C</p>
                <p>El Clima: ${data.weather[0].description}</p>
                <p>La Humedad es de un: ${data.main.humidity}%</p>
                <p>El viento va a una velocidad de: ${data.wind.speed} m/s</p>
                <p>La visibilidad máxima es de: ${data.visibility / 1000} km</p>
            `;

            // Reiniciar el tiempo para la siguiente actualización
            tiempoRestante = 10;
            startCountdown();
        })
        .catch(error => {
            console.error(`Error en la ciudad ${city}:`, error);
            const errorMessage = document.createElement('p');
            errorMessage.textContent = `Hubo un error al obtener los datos del clima para ${city}. Por favor, intenta nuevamente.`;
            weatherDiv.appendChild(errorMessage);
        });
}

function añadirCiudad() {
    let newCity = prompt("Ingresa una ciudad").toLowerCase();
    city = newCity;
    console.log(city);
    TomarClima();
}

function startCountdown() {
    // Limpiar cualquier intervalo previo
    if (intervalId) {
        clearInterval(intervalId);
    }

    // Crear un nuevo intervalo para la cuenta regresiva
    intervalId = setInterval(() => {
        const timerDiv = document.getElementById('timer');
        timerDiv.innerHTML = `Tiempo restante: 0:${tiempoRestante < 10 ? '0' : ''}${tiempoRestante}`;

        if (tiempoRestante > 0) {
            tiempoRestante--;
        } else {
            clearInterval(intervalId);
            TomarClima(); // Volver a tomar el clima cuando el tiempo llegue a 0
        }
    }, 1000);
}

// Llamada inicial para tomar el clima y empezar la cuenta regresiva
TomarClima();
