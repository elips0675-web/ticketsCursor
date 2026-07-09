import ldap from 'ldapjs'
import jwt from 'jsonwebtoken'
import knex from '../db.js'
import { getSettings } from '../settings.js'
import { JWT_SECRET } from '../middleware.js'
import logger from '../logger.js'

export async function authenticateLDAP(req, res) {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' })
  }

  const settings = await getSettings()
  const url = settings.LDAP_URL || process.env.LDAP_URL
  const baseDN = settings.LDAP_BASE_DN || process.env.LDAP_BASE_DN
  const bindDN = settings.LDAP_BIND_DN || process.env.LDAP_BIND_DN
  const bindCredentials = settings.LDAP_BIND_CREDENTIALS || process.env.LDAP_BIND_CREDENTIALS

  if (!url || !baseDN) {
    return res.status(503).json({ message: 'LDAP not configured' })
  }

  const client = ldap.createClient({ url })

  return new Promise((resolve) => {
    const userDN = `uid=${username},${baseDN}`
    const searchDN = bindDN || userDN
    const searchPass = bindDN ? bindCredentials || password : password

    client.bind(searchDN, searchPass, (bindErr) => {
      if (bindErr) {
        client.unbind()
        return resolve(res.status(401).json({ message: 'LDAP authentication failed' }))
      }

      const opts = { scope: 'sub', filter: `(uid=${username})`, attributes: ['cn', 'mail', 'uid'] }
      client.search(baseDN, opts, (searchErr, searchRes) => {
        if (searchErr) {
          client.unbind()
          return resolve(res.status(500).json({ message: 'LDAP search failed' }))
        }

        let entry = null
        searchRes.on('searchEntry', (e) => { entry = e.object })
        searchRes.on('end', async () => {
          client.unbind()
          if (!entry) return resolve(res.status(401).json({ message: 'User not found in LDAP' }))

          const email = entry.mail || `${username}@company.ru`
          const name = entry.cn || entry.displayName || username

          try {
            const [rows] = await knex.raw(
              'SELECT id, name, email, role FROM employees WHERE email = ? AND is_active = 1',
              [email],
            )
            let employee = rows[0]
            if (!employee) {
              const [result] = await knex.raw(
                'INSERT INTO employees (name, email, role, is_active) VALUES (?, ?, ?, 1)',
                [name, email, 'agent'],
              )
              employee = { id: result.insertId, name, email, role: 'agent' }
            }
            const token = jwt.sign({ userId: employee.id, role: employee.role }, JWT_SECRET, { expiresIn: '24h' })
            resolve(res.json({ token, employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role } }))
          } catch (err) {
            logger.error('LDAP auto-provision error:', err)
            resolve(res.status(500).json({ message: 'Internal server error' }))
          }
        })
        searchRes.on('error', () => {
          client.unbind()
          resolve(res.status(500).json({ message: 'LDAP search error' }))
        })
      })
    })
  })
}
