import prisma from './src/prisma.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

try {
  // Create a JWT token
  const token = jwt.sign({ userId: 1, role: 'super_admin' }, JWT_SECRET, { expiresIn: '1h' })
  console.log('Token:', token)

  // Make HTTP request
  const res = await fetch('http://localhost:4000/api/polls/1/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ optionId: 3 }),
  })
  const body = await res.text()
  console.log('Status:', res.status, 'Body:', body.substring(0, 500))
} catch(e) {
  console.error('Fetch error:', e.message)
}

await prisma.$disconnect()
