// import dotenv from 'dotenv'
// import pg from 'pg'

// dotenv.config()

// const { Pool } = pg

// const pool = new Pool({
//   host: "localhost",
//   port: 5432,
//   database: "biospatial",
//   user: "postgres",
//   password: 1234,
// })

// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.log('Error conectando a la base:', err)
//   } else {
//     console.log('Conexión exitosa a la base de datos')
//   }
// })

// export default pool