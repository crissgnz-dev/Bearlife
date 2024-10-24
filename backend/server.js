//Dependencias que se requieren 
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

//constante para el servidor (app)
const app = express();

const db = mysql.createConnection({
  host: 'localhost',  // Esto sigue siendo correcto
  user: 'root',       // Usuario por defecto en XAMPP
  password: '',       // Contraseña por defecto (vacía en XAMPP)
  database: 'test',   // Asegúrate de que la base de datos 'test' exista
  port: 3306          // Puerto predeterminado para MySQL
});


//Establecer conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a mysql');
});

const path = require('path');

// Middleware para interpretar JSON
app.use(express.json());  // Añadir esto para interpretar JSON en las solicitudes POST

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../login')));
app.use(express.static(path.join(__dirname, '../')));

//Iniciar servidor en puerto 3000
app.listen(3000, () => {
    console.log('Server corriendo en puerto 3000');
});

// CREATE - Ruta para login (POST)
app.post('/api/login', (req, res) => {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    const query = 'SELECT * FROM usuario WHERE nombre = ?';
    db.query(query, [nombre], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error en el servidor', error: err });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Nombre o contraseña incorrectos' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Nombre o contraseña incorrectos' });
        }

        // Aquí puedes devolver un token o simplemente el nombre de usuario
        res.status(200).json({ message: 'Autenticación exitosa', nombre: user.nombre });
    });
});

// Ruta para crear un usuario (POST)
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
  }

  // Primero, verifica si el nombre de usuario ya existe
  const checkQuery = 'SELECT * FROM usuario WHERE nombre = ?';
  db.query(checkQuery, [username], async (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length > 0) {
          return res.status(409).json({ message: 'El nombre de usuario ya existe' }); // Conflict
      }

      // Si el nombre de usuario no existe, procede a crear uno nuevo
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = 'INSERT INTO usuario (nombre, password) VALUES (?, ?)';
      
      db.query(insertQuery, [username, hashedPassword], (err, results) => {
          if (err) {
              return res.status(500).json({ message: 'Error en el servidor', error: err });
          }
          res.status(201).json({ message: 'Usuario creado exitosamente' });
      });
  });
});

=======
//Dependencias que se requieren 
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

//constante para el servidor (app)
const app = express();

const db = mysql.createConnection({
  host: 'localhost',  // Esto sigue siendo correcto
  user: 'root',       // Usuario por defecto en XAMPP
  password: '',       // Contraseña por defecto (vacía en XAMPP)
  database: 'test',   // Asegúrate de que la base de datos 'test' exista
  port: 3306          // Puerto predeterminado para MySQL
});


//Establecer conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a mysql');
});

const path = require('path');

// Middleware para interpretar JSON
app.use(express.json());  // Añadir esto para interpretar JSON en las solicitudes POST

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../login')));
app.use(express.static(path.join(__dirname, '../')));

//Iniciar servidor en puerto 3000
app.listen(3000, () => {
    console.log('Server corriendo en puerto 3000');
});

// CREATE - Ruta para login (POST)
app.post('/api/login', (req, res) => {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    const query = 'SELECT * FROM usuario WHERE nombre = ?';
    db.query(query, [nombre], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error en el servidor', error: err });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Nombre o contraseña incorrectos' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Nombre o contraseña incorrectos' });
        }

        // Aquí puedes devolver un token o simplemente el nombre de usuario
        res.status(200).json({ message: 'Autenticación exitosa', nombre: user.nombre });
    });
});

// Ruta para crear un usuario (POST)
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
  }

  // Primero, verifica si el nombre de usuario ya existe
  const checkQuery = 'SELECT * FROM usuario WHERE nombre = ?';
  db.query(checkQuery, [username], async (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length > 0) {
          return res.status(409).json({ message: 'El nombre de usuario ya existe' }); // Conflict
      }

      // Si el nombre de usuario no existe, procede a crear uno nuevo
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = 'INSERT INTO usuario (nombre, password) VALUES (?, ?)';
      
      db.query(insertQuery, [username, hashedPassword], (err, results) => {
          if (err) {
              return res.status(500).json({ message: 'Error en el servidor', error: err });
          }
          res.status(201).json({ message: 'Usuario creado exitosamente' });
      });
  });
});
