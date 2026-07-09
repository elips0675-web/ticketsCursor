import winston from 'winston'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logDir = path.join(__dirname, '..', 'logs')
fs.mkdirSync(logDir, { recursive: true })

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} ${level}: ${message}${metaStr}`
        }),
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxSize: '10m', maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxSize: '10m', maxFiles: 5 }),
  ],
})

export default logger