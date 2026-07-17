import prisma from './src/prisma.js'
try {
  const r = await prisma.notifications.findMany({ where: { user_id: 1 }, take: 1 })
  console.log('OK:', r.length)
} catch (e) {
  console.log('ERR:', e.message?.substring(0, 300))
}
await prisma.$disconnect()
