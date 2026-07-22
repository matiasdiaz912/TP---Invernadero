import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
//sector donde se relaciona con el archivo .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('Error conectando a la base:', err)
  } else {
    console.log('Conexión exitosa a la base de datos')
  }
})

export default pool