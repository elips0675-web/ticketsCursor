import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { JWT_SECRET } from '../middleware.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, password_hash FROM employees WHERE email = ? AND is_active = 1',
      [email],
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const employee = rows[0]
    const valid = await bcrypt.compare(password, employee.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = jwt.sign({ userId: employee.id, role: employee.role }, JWT_SECRET, { expiresIn: '24h' })
    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/register', async (req, res) => {
  const { name, email, password, department, title } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Имя, email и пароль обязательны' })
  }
  try {
    const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
    }
    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO employees (name, email, password_hash, role, department, title, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [name, email, hash, 'agent', department || '', title || 'Сотрудник'],
    )
    const token = jwt.sign({ userId: result.insertId, role: 'agent' }, JWT_SECRET, { expiresIn: '24h' })
    res.status(201).json({
      token,
      employee: { id: result.insertId, name, email, role: 'agent' },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

// Dev auto-login
router.post('/dev-login', async (req, res) => {
  const token = jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, employee: { id: 1, name: 'Алексей Петров', email: 'alexey@example.com', role: 'admin' } })
})

export default router
