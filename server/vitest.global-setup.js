import mysql from 'mysql2/promise'
import { execSync } from 'child_process'

const dbName = 'servicedesk_test'

export async function setup() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', port: 3306 })
  await conn.execute(`DROP DATABASE IF EXISTS \`${dbName}\``)
  await conn.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.end()

  const knexEnv = { ...process.env, DB_HOST: 'localhost', DB_PORT: '3306', DB_USER: 'root', DB_PASSWORD: '', DB_NAME: dbName }
  execSync('npx knex migrate:latest --knexfile knexfile.js', { stdio: 'pipe', env: knexEnv })

  const fix = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: dbName })
  await fix.execute('ALTER TABLE employees MODIFY COLUMN role VARCHAR(20) NOT NULL')
  await fix.execute('ALTER TABLE tickets MODIFY COLUMN status VARCHAR(20) NOT NULL')
  await fix.execute('ALTER TABLE tickets MODIFY COLUMN priority VARCHAR(20) NOT NULL')
  await fix.end()

  execSync('npx knex seed:run --knexfile knexfile.js', { stdio: 'pipe', env: knexEnv })

  process.env.DATABASE_URL = `mysql://root:@localhost:3306/${dbName}`
  process.env.DIRECT_DATABASE_URL = `mysql://root:@localhost:3306/${dbName}`
  process.env.DB_NAME = dbName
  process.env.NODE_ENV = 'test'
  process.env.VAPID_PUBLIC_KEY = 'BKvM9b1p0vP3Q8j5tL7mW9nC4rX6yZ2aB8dE0gI3kO5sU7wY1cF4hJ6lN8pR2tV'
  process.env.VAPID_PRIVATE_KEY = 'z9x8c7v6b5n4m3l2k1j0h9g8f7d6s5a4'
}

export async function teardown() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', port: 3306 })
  await conn.execute(`DROP DATABASE IF EXISTS \`${dbName}\``)
  await conn.end()
}
