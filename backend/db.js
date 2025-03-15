require("dotenv").config();
const { Pool } = require("pg");


const pool = new Pool({
  user: 'projectallotmentportal', // SHOULD CHANGE IT TO YOUR USER NAME 
  host: 'localhost',
  database: 'ProjectAllotment',
  port: 5432,
});

pool.query('SELECT * FROM projects', (err, res) => {
  console.log(res.rows);
   // Always close the pool when done
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL! 🚀"))
  .catch(err => console.error("Database connection error", err));

module.exports = pool;
