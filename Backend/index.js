const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(cors());
app.use(express.json());

// Rutas POST
app.post("/buy-corn", async (req, res) => {
  try {
    const body = req.body;
    const connection = await pool.getConnection();

    // Verificar si el cliente ha comprado en los últimos 60 segundos
    const [rows] = await connection.execute(
      `SELECT * FROM corns_purchase WHERE client_id = ? ORDER BY purchase_datetime DESC LIMIT 1`,
      [body.clientId]
    );

    if (rows.length > 0) {
      if (new Date(rows[0].purchase_datetime).getTime() > Date.now() - 60000) {
        return res.status(429).json({
          mensaje: "Too Many Requests",
        });
      }
    }

    // Insertar la compra en la base de datos y responder con un mensaje de éxito
    await connection.execute(
      `INSERT INTO corns_purchase (client_id) VALUES (?)`,
      [body.clientId]
    );
    return res.status(200).json({
      mensaje: "🌽",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

app.post("/corns-bought", async (req, res) => {
  try {
    const body = req.body;
    const connection = await pool.getConnection();

    // Obtener las compras de un cliente
    const [rows] = await connection.execute(
      `SELECT * FROM corns_purchase WHERE client_id = ?`,
      [body.clientId]
    );
    return res.status(200).json({
      corn: rows.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Corn 🌽 server running on port ${PORT}`);
});

// Crear tabla si no existe
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS corns_purchase (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        purchase_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
  } catch (error) {
    console.error("Error creating table:", error);
  }
})();
