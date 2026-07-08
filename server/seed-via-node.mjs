import mysql from 'mysql2/promise'
import fs from 'fs'

const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'servicedesk', charset: 'utf8mb4' })

const sql = fs.readFileSync('seed.sql', 'utf8')

// Split by semicolons and execute each statement
const statements = sql
  .replace(/--.*$/gm, '')  // remove comments
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)

for (const stmt of statements) {
  try {
    await conn.execute(stmt)
  } catch (err) {
    // Skip IF NOT EXISTS / CREATE INDEX errors
    if (err.code === 'ER_TABLE_EXISTS_ERR') continue
    if (err.code === 'ER_DUP_FIELDNAME') continue
    console.error('Error executing:', stmt.substring(0, 80), err.message)
  }
}

// Verify
const [rows] = await conn.execute('SELECT name FROM employees ORDER BY id')
console.log('Employees:', rows.map(r => r.name).join(', '))
await conn.end()
