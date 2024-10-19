const apiKey = '4a05cc810f6086d5c98e5b6aedf922f7';
let tiempoRestante = 10;
let coords = {};
navigator.geolocation.getCurrentPosition(
    ({coords: { latitude, longitude}})=>{
        coords = {
            lat: latitude,
            long: longitude,
        };
        console.log(coords);
        // Generar el enlace a Google Maps 
        const googleMapsLink = `https://www.google.com/maps/@${latitude},${longitude},15z`; 
        console.log(googleMapsLink);  // Imprimir el enlace en la consola 
    },
    ()=>{
        alert("Error")
    }
);




function TomarClima(){

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.long}&appid=${apiKey}&units=metric&lang=es`;
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        const weatherDiv = document.getElementById('weather');
        let cityWeather = document.getElementById('cityWeather');
        if (!cityWeather) {
            cityWeather = document.createElement('div');
            cityWeather.id = 'cityWeather';
            weatherDiv.appendChild(cityWeather);
        }
        cityWeather.innerHTML = `
            <h1>${data.name}</h1>
            <p>La Temperatura: ${data.main.temp}°C</p>
            <p>El Clima: ${data.weather[0].description}</p>
            <p>La Humedad es de un: ${data.main.humidity}%</p>
            <p>El viento va a una velocidad de: ${data.wind.speed} m/s</p>
            <p>La visibilidad máxima es de: ${data.visibility / 1000} km</p>
        `;
    })

    .catch(error => {
        console.error('Error', error);
    });
}

function actualizarTemporizador() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    document.getElementById('timer').textContent = `Tiempo restante: ${minutos}:${segundos < 10 ? '0' + segundos : segundos}`;
    tiempoRestante--;

    if (tiempoRestante < 0) {
        TomarClima();
        tiempoRestante = 10;
    }
}

setInterval(actualizarTemporizador, 1000);
